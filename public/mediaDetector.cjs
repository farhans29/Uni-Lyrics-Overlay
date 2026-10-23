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

let detectorProcess = null;
let latestMediaState = { active: false };
let buffer = "";
const MAX_BUFFER_LENGTH = 16384;

function startMediaDetector() {
  if (process.platform !== "win32" || detectorProcess) {
    return;
  }

  const encoded = Buffer.from(buildPsScript(process.pid), "utf16le").toString("base64");
  detectorProcess = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-EncodedCommand", encoded],
    {
      windowsHide: true,
      stdio: ["ignore", "pipe", "ignore"],
    }
  );

  detectorProcess.stdout.setEncoding("utf8");
  detectorProcess.stdout.on("data", (chunk) => {
    buffer += chunk;
    if (buffer.length > MAX_BUFFER_LENGTH) {
      buffer = buffer.slice(-MAX_BUFFER_LENGTH);
    }
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        try {
          latestMediaState = JSON.parse(trimmed);
        } catch {
          // ignore malformed line
        }
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
  if (process.platform !== "win32") {
    return { active: false };
  }
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
