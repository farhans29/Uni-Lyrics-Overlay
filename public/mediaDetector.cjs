const { spawn } = require("node:child_process");

function buildPsScript(parentPid) {
  return `
$ParentPid = ${Number(parentPid)}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
})[0]

$mediaPropsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
$asTaskMgr = $asTaskGeneric.MakeGenericMethod($mgrType)
$asTaskProps = $asTaskGeneric.MakeGenericMethod($mediaPropsType)

Function AwaitTask($WinRtTask, $GenericMethod) {
  $netTask = $GenericMethod.Invoke($null, @($WinRtTask))
  $netTask.Wait(1500) | Out-Null
  $netTask.Result
}

$mgr = AwaitTask ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) $asTaskMgr
$tickCount = 0

while ($true) {
  # Watchdog: self-terminate immediately if parent Electron/Node process exits or crashes
  if (-not (Get-Process -Id $ParentPid -ErrorAction SilentlyContinue)) {
    exit 0
  }

  try {
    $session = $mgr.GetCurrentSession()
    if ($session) {
      $props = AwaitTask ($session.TryGetMediaPropertiesAsync()) $asTaskProps
      $timeline = $session.GetTimelineProperties()
      $info = $session.GetPlaybackInfo()
      $status = $info.PlaybackStatus.ToString()
      $posMs = $timeline.Position.TotalMilliseconds
      if ($status -eq 'Playing' -and $timeline.LastUpdatedTime.Year -gt 2000) {
        $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalMilliseconds
        if ($elapsed -gt 0 -and $elapsed -lt 300000) {
          $posMs += $elapsed
        }
      }
      $out = [PSCustomObject]@{
        active = $true
        source = [string]$session.SourceAppUserModelId
        title = [string]$props.Title
        artist = [string]$props.Artist
        album = [string]$props.AlbumTitle
        status = [string]$status
        positionMs = [math]::Max(0, [math]::Round($posMs))
        durationMs = [math]::Max(0, [math]::Round($timeline.EndTime.TotalMilliseconds))
        updatedAt = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
      } | ConvertTo-Json -Compress
      [Console]::WriteLine($out)
    } else {
      [Console]::WriteLine('{"active":false}')
    }
  } catch {
    [Console]::WriteLine('{"active":false}')
  }

  $tickCount++
  if ($tickCount -ge 30) {
    $tickCount = 0
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
  }

  Start-Sleep -Milliseconds 1000
}
`;
}

function buildLinuxScript(parentPid) {
  return `
ParentPid=${Number(parentPid)}

HAVE_PLAYERCTL=0
if command -v playerctl >/dev/null 2>&1; then
  HAVE_PLAYERCTL=1
fi

HAVE_PYTHON=0
if command -v python3 >/dev/null 2>&1; then
  HAVE_PYTHON=1
fi

while true; do
  # Watchdog: self-terminate immediately if parent Electron/Node process exits
  if ! kill -0 "$ParentPid" 2>/dev/null; then
    exit 0
  fi

  OUT=""

  if [ "$HAVE_PLAYERCTL" -eq 1 ]; then
    # Query active player via MPRIS using playerctl
    RAW=$(playerctl -a metadata --format '{{status}}\t{{playerName}}\t{{xesam:title}}\t{{xesam:artist}}\t{{xesam:album}}\t{{position}}\t{{mpris:length}}' 2>/dev/null | grep -E '^Playing' | head -n 1)
    if [ -z "$RAW" ]; then
      RAW=$(playerctl -a metadata --format '{{status}}\t{{playerName}}\t{{xesam:title}}\t{{xesam:artist}}\t{{xesam:album}}\t{{position}}\t{{mpris:length}}' 2>/dev/null | grep -E '^Paused' | head -n 1)
    fi
    if [ -n "$RAW" ]; then
      OUT="$RAW"
    fi
  fi

  # Fallback to python3 + busctl if playerctl is unavailable
  if [ -z "$OUT" ] && [ "$HAVE_PYTHON" -eq 1 ]; then
    OUT=$(python3 -c '
import subprocess, re

try:
    res = subprocess.run(["busctl", "--user", "list", "--no-legend"], capture_output=True, text=True, timeout=1)
    players = [line.split()[0] for line in res.stdout.splitlines() if line and line.split()[0].startswith("org.mpris.MediaPlayer2.")]
    target_player = None
    target_status = None
    for p in players:
        stat_res = subprocess.run(["busctl", "--user", "get-property", p, "/org/mpris/MediaPlayer2", "org.mpris.MediaPlayer2.Player", "PlaybackStatus"], capture_output=True, text=True, timeout=0.8)
        val = stat_res.stdout.strip().replace("s \"", "").replace("\"", "")
        if val == "Playing":
            target_player = p
            target_status = "Playing"
            break
        elif val == "Paused" and not target_player:
            target_player = p
            target_status = "Paused"

    if target_player:
        pos_res = subprocess.run(["busctl", "--user", "get-property", target_player, "/org/mpris/MediaPlayer2", "org.mpris.MediaPlayer2.Player", "Position"], capture_output=True, text=True, timeout=0.8)
        pos_parts = pos_res.stdout.strip().split()
        pos_us = int(pos_parts[1]) if len(pos_parts) > 1 and pos_parts[1].isdigit() else 0

        meta_res = subprocess.run(["busctl", "--user", "get-property", target_player, "/org/mpris/MediaPlayer2", "org.mpris.MediaPlayer2.Player", "Metadata"], capture_output=True, text=True, timeout=0.8)
        meta_str = meta_res.stdout

        title_m = re.search(r"\"xesam:title\"\s+s\s+\"([^\"]*)\"", meta_str)
        artist_m = re.search(r"\"xesam:artist\"\s+as\s+\d+\s+\"([^\"]*)\"", meta_str)
        album_m = re.search(r"\"xesam:album\"\s+s\s+\"([^\"]*)\"", meta_str)
        len_m = re.search(r"\"mpris:length\"\s+x\s+(\d+)", meta_str)

        title = title_m.group(1) if title_m else ""
        artist = artist_m.group(1) if artist_m else ""
        album = album_m.group(1) if album_m else ""
        dur_us = int(len_m.group(1)) if len_m else 0
        name = target_player.replace("org.mpris.MediaPlayer2.", "")

        if title:
            print(f"{target_status}\t{name}\t{title}\t{artist}\t{album}\t{pos_us}\t{dur_us}")
except Exception:
    pass
' 2>/dev/null)
  fi

  if [ -n "$OUT" ]; then
    printf "%s\n" "$OUT"
  else
    printf "inactive\n"
  fi

  sleep 1
done
`;
}

function buildMacScript(parentPid) {
  return `
ParentPid=${Number(parentPid)}

while true; do
  # Watchdog: self-terminate immediately if parent Electron/Node process exits
  if ! kill -0 "$ParentPid" 2>/dev/null; then
    exit 0
  fi

  OUT=$(osascript -e '
    set mediaOut to ""

    -- 1. Spotify (Desktop App)
    if application "Spotify" is running then
      try
        tell application "Spotify"
          set sState to (player state as string)
          if sState is not "stopped" then
            set sTrack to name of current track
            set sArtist to artist of current track
            set sAlbum to album of current track
            set sPos to (player position * 1000) as integer
            set sDur to (duration of current track) as integer
            if sState is "playing" then
              return sState & "\tSpotify\t" & sTrack & "\t" & sArtist & "\t" & sAlbum & "\t" & sPos & "\t" & sDur
            else
              set mediaOut to sState & "\tSpotify\t" & sTrack & "\t" & sArtist & "\t" & sAlbum & "\t" & sPos & "\t" & sDur
            end if
          end if
        end tell
      end try
    end if

    -- 2. Apple Music (Music.app)
    if application "Music" is running then
      try
        tell application "Music"
          set mState to (player state as string)
          if mState is not "stopped" then
            set mTrack to name of current track
            set mArtist to artist of current track
            set mAlbum to album of current track
            set mPos to (player position * 1000) as integer
            set mDur to ((duration of current track) * 1000) as integer
            if mState is "playing" then
              return mState & "\tApple Music\t" & mTrack & "\t" & mArtist & "\t" & mAlbum & "\t" & mPos & "\t" & mDur
            else if mediaOut is "" then
              set mediaOut to mState & "\tApple Music\t" & mTrack & "\t" & mArtist & "\t" & mAlbum & "\t" & mPos & "\t" & mDur
            end if
          end if
        end tell
      end try
    end if

    -- 3. Google Chrome
    if mediaOut is "" and application "Google Chrome" is running then
      try
        tell application "Google Chrome"
          repeat with w in windows
            repeat with t in tabs of w
              set tUrl to URL of t
              if tUrl contains "music.youtube.com" or tUrl contains "open.spotify.com" or tUrl contains "youtube.com/watch" then
                set tTitle to title of t
                if tTitle does not start with "YouTube Music" and (tTitle contains " - " or tTitle contains " • ") then
                  return "Playing\tYouTube Music\t" & tTitle & "\t\t\t0\t0"
                end if
              end if
            end repeat
          end repeat
        end tell
      end try
    end if

    -- 4. Safari
    if mediaOut is "" and application "Safari" is running then
      try
        tell application "Safari"
          repeat with w in windows
            repeat with t in tabs of w
              set tUrl to URL of t
              if tUrl contains "music.youtube.com" or tUrl contains "open.spotify.com" or tUrl contains "youtube.com/watch" then
                set tTitle to name of t
                if tTitle does not start with "YouTube Music" and (tTitle contains " - " or tTitle contains " • ") then
                  return "Playing\tYouTube Music\t" & tTitle & "\t\t\t0\t0"
                end if
              end if
            end repeat
          end repeat
        end tell
      end try
    end if

    -- 5. Microsoft Edge
    if mediaOut is "" and application "Microsoft Edge" is running then
      try
        tell application "Microsoft Edge"
          repeat with w in windows
            repeat with t in tabs of w
              set tUrl to URL of t
              if tUrl contains "music.youtube.com" or tUrl contains "open.spotify.com" or tUrl contains "youtube.com/watch" then
                set tTitle to title of t
                if tTitle does not start with "YouTube Music" and (tTitle contains " - " or tTitle contains " • ") then
                  return "Playing\tYouTube Music\t" & tTitle & "\t\t\t0\t0"
                end if
              end if
            end repeat
          end repeat
        end tell
      end try
    end if

    -- 6. Brave Browser
    if mediaOut is "" and application "Brave Browser" is running then
      try
        tell application "Brave Browser"
          repeat with w in windows
            repeat with t in tabs of w
              set tUrl to URL of t
              if tUrl contains "music.youtube.com" or tUrl contains "open.spotify.com" or tUrl contains "youtube.com/watch" then
                set tTitle to title of t
                if tTitle does not start with "YouTube Music" and (tTitle contains " - " or tTitle contains " • ") then
                  return "Playing\tYouTube Music\t" & tTitle & "\t\t\t0\t0"
                end if
              end if
            end repeat
          end repeat
        end tell
      end try
    end if

    -- 7. Arc Browser
    if mediaOut is "" and application "Arc" is running then
      try
        tell application "Arc"
          repeat with w in windows
            repeat with t in tabs of w
              set tUrl to URL of t
              if tUrl contains "music.youtube.com" or tUrl contains "open.spotify.com" or tUrl contains "youtube.com/watch" then
                set tTitle to title of t
                if tTitle does not start with "YouTube Music" and (tTitle contains " - " or tTitle contains " • ") then
                  return "Playing\tYouTube Music\t" & tTitle & "\t\t\t0\t0"
                end if
              end if
            end repeat
          end repeat
        end tell
      end try
    end if

    if mediaOut is not "" then
      return mediaOut
    else
      return "inactive"
    end if
  ')

  if [ -n "$OUT" ]; then
    printf "%s\n" "$OUT"
  else
    printf "inactive\n"
  fi

  sleep 1
done
`;
}

function parseDetectorLine(line, platform) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "inactive" || trimmed === '{"active":false}') {
    return { active: false };
  }

  // Handle Windows JSON format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  // Handle Tab-delimited format (Linux MPRIS & macOS osascript)
  // Format: STATUS \t SOURCE \t TITLE \t ARTIST \t ALBUM \t POSITION \t DURATION
  const parts = trimmed.split("\t");
  if (parts.length >= 7) {
    let [statusRaw, source, title, artist, album, posRaw, durRaw] = parts;
    if (!title || !title.trim()) {
      return { active: false };
    }

    // Clean up browser tab title format (e.g. "Song - Artist - YouTube Music")
    if (source === "YouTube Music" && (!artist || !artist.trim())) {
      let cleaned = title.replace(/\s*-\s*YouTube Music\s*$/i, "").trim();
      if (cleaned.includes(" - ")) {
        const segs = cleaned.split(" - ");
        title = segs[0].trim();
        artist = segs.slice(1).join(" - ").trim();
      } else if (cleaned.includes(" • ")) {
        const segs = cleaned.split(" • ");
        title = segs[0].trim();
        artist = segs.slice(1).join(" • ").trim();
      }
    }

    let pos = Math.max(0, Math.round(Number(posRaw) || 0));
    let dur = Math.max(0, Math.round(Number(durRaw) || 0));

    if (platform === "linux") {
      // MPRIS uses microseconds for Position and mpris:length. Convert to milliseconds.
      pos = Math.round(pos / 1000);
      dur = Math.round(dur / 1000);
    }

    const isPlaying = statusRaw.toLowerCase() === "playing";
    return {
      active: true,
      source: (source || "").trim(),
      title: title.trim(),
      artist: (artist || "").trim(),
      album: (album || "").trim(),
      status: isPlaying ? "Playing" : "Paused",
      positionMs: pos,
      durationMs: dur,
      updatedAt: Date.now(),
    };
  }

  return null;
}

let detectorProcess = null;
let latestMediaState = { active: false };
let buffer = "";
const MAX_BUFFER_LENGTH = 16384;

function startMediaDetector() {
  if (detectorProcess) {
    return;
  }

  if (process.platform === "win32") {
    const encoded = Buffer.from(buildPsScript(process.pid), "utf16le").toString("base64");
    detectorProcess = spawn(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-EncodedCommand", encoded],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "ignore"],
      }
    );
  } else if (process.platform === "linux") {
    detectorProcess = spawn("bash", ["-c", buildLinuxScript(process.pid)], {
      stdio: ["ignore", "pipe", "ignore"],
    });
  } else if (process.platform === "darwin") {
    detectorProcess = spawn("bash", ["-c", buildMacScript(process.pid)], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  } else {
    return;
  }

  detectorProcess.stderr?.setEncoding("utf8");
  detectorProcess.stderr?.on("data", (chunk) => {
    const msg = chunk.toString().trim();
    if (msg) {
      console.warn("[MediaDetector Warning]:", msg);
      if (msg.includes("-1743") || msg.toLowerCase().includes("not authorized")) {
        console.error(
          "[MediaDetector Permission Error] macOS Automation permission required. Please grant permission in System Settings > Privacy & Security > Automation."
        );
      }
    }
  });

  detectorProcess.stdout?.setEncoding("utf8");
  detectorProcess.stdout?.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.length > MAX_BUFFER_LENGTH) {
      buffer = buffer.slice(-MAX_BUFFER_LENGTH);
    }
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const parsed = parseDetectorLine(line, process.platform);
      if (parsed) {
        latestMediaState = parsed;
      }
    }
  });

  const cleanup = () => {
    detectorProcess = null;
    buffer = "";
  };

  detectorProcess.on("exit", cleanup);
  detectorProcess.on("error", cleanup);
}

function getSystemMedia() {
  if (!detectorProcess) {
    startMediaDetector();
  }
  if (
    latestMediaState?.active &&
    latestMediaState.status === "Playing" &&
    latestMediaState.updatedAt
  ) {
    const delta = Math.max(0, Date.now() - latestMediaState.updatedAt);
    if (delta < 5000) {
      return {
        ...latestMediaState,
        positionMs: Math.min(
          latestMediaState.durationMs || Infinity,
          latestMediaState.positionMs + delta
        ),
      };
    }
  }
  return latestMediaState;
}

function stopMediaDetector() {
  if (detectorProcess) {
    detectorProcess.removeAllListeners();
    detectorProcess.stdout?.removeAllListeners();
    detectorProcess.kill();
    detectorProcess = null;
    buffer = "";
  }
}

module.exports = {
  startMediaDetector,
  getSystemMedia,
  stopMediaDetector,
};
