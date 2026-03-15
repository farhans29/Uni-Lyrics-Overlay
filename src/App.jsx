import { useEffect, useState } from "react";

import { useSpotifyAuth } from "./hooks/useSpotifyAuth";
import { useYTMusicAuth } from "./hooks/useYTMusicAuth";
import { formatTime, getCallSpeed } from "./util/helperFunctions";
import TitleDisplay from "./components/TitleDisplay";
import { LyricsDisplay } from "./components/LyricsDisplay";
import Settings from "./components/Settings";
const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN;

function App() {
  const [mode, setMode] = useState("ytmusic"); // 'spotify' or 'ytmusic'
  const [ytQuery, setYtQuery] = useState("");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [transparency, setTransparency] = useState(
    localStorage.getItem('transparency') ? Number(localStorage.getItem('transparency')) : 60
  );

  const [songData, setSongData] = useState(null);
  const [songAudioData, setSongAudioData] = useState(null);
  const [lyrics, setLyrics] = useState(null);

  const name = songData?.item?.name || songData?.name;
  const artist = songData?.item?.artists?.map((a) => a.name).join(", ") || songData?.artist?.name;
  const trackId = songData?.item?.id || songData?.videoId;
  const imageUrl = songData?.item?.album?.images?.[0]?.url || songData?.thumbnails?.[0]?.url;

  const spotifyApi = useSpotifyAuth(mode === "spotify");
  const { fetchLyrics: fetchYTLyrics, loading: ytLoading, error: ytError } = useYTMusicAuth();

  useEffect(() => {
    if (mode !== "spotify") return;
    
    let interval;

    async function fetchData() {
      try {
        const res = await spotifyApi.getMyCurrentPlayingTrack();
        if (res?.item) {
          setSongData(res);
        } else {
          console.log("No song is currently playing.");
        }
      } catch (err) {
        console.error("❌ Error fetching current track:", err);
      }
    }
    fetchData();
    interval = setInterval(fetchData, getCallSpeed(songAudioData?.tempo));

    return () => clearInterval(interval);
  }, [mode, songAudioData?.tempo, spotifyApi]);

  useEffect(() => {
    if (mode !== "spotify" || !trackId) return;

    async function fetchTrackData() {
      try {
        const [lyricsRes, audioRes] = await Promise.all([
          fetch(
            `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
            {
              headers: {
                Authorization: `Bearer ${BEARER_TOKEN}`,
                "App-Platform": "WebPlayer",
              },
            }
          ),
          fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: {
              Authorization: `Bearer ${BEARER_TOKEN}`,
              "App-Platform": "WebPlayer",
            },
          }),
        ]);

        const lyricsData = await lyricsRes.json();
        const audioData = await audioRes.json();

        setLyrics(lyricsData?.lyrics?.lines);
        setSongAudioData(audioData);
      } catch (err) {
        setLyrics(null);
        console.error("❌ Error fetching track data:", err);
      }
    }

    fetchTrackData();
  }, [mode, trackId]);

  const handleYTSearch = async (e) => {
    e.preventDefault();
    if (!ytQuery.trim()) return;

    setSongData(null);
    setLyrics(null);
    setSongAudioData(null);

    const res = await fetchYTLyrics(ytQuery);
    if (res && res.song) {
      setSongData(res.song);
      
      // YT Music lyrics can be plain text or object. Format it for LyricsDisplay
      let formattedLyrics = null;
      if (typeof res.lyrics === 'string') {
        formattedLyrics = res.lyrics.split('\n').map(line => ({ words: line, startTimeMs: 0 }));
      } else if (Array.isArray(res.lyrics)) {
        // If it's already an array of lines, adapt it
        formattedLyrics = res.lyrics.map(line => ({ words: line.text || line, startTimeMs: line.time || 0 }));
      }
      
      setLyrics(formattedLyrics || []);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('transparency', transparency);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    // Update body's CSS variable for dynamic alpha transparency
    document.body.style.setProperty('--bg-alpha', (transparency / 100).toString());
  }, [transparency]);

  useEffect(() => {
    // Optional: apply light-theme to body instead of container to ensure full coverage
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Settings Gear SVG
  const GearIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );

  return (
    <div className={`divContainer ${theme === 'light' ? 'light-theme' : ''}`}>
      {isSettingsOpen && (
        <Settings 
          theme={theme}
          setTheme={setTheme}
          transparency={transparency}
          setTransparency={setTransparency}
          onSave={saveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      
      {/* Sleek Control Bar */}
      <div className="control-bar">
        {/* Left Side: Window Controls */}
        <div className="window-controls">
          <button 
            className="icon-btn window-btn close-btn"
            onClick={() => window.electronAPI && window.electronAPI.closeWindow()}
            title="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <button 
            className="icon-btn window-btn min-btn"
            onClick={() => window.electronAPI && window.electronAPI.minimizeWindow()}
            title="Minimize"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        {/* Center: Modes */}
        <div className="segmented-control">
          <button 
            className={`segment-btn ${mode === 'spotify' ? 'active spotify-mode' : ''}`}
            onClick={() => { setMode("spotify"); setSongData(null); setLyrics(null); }}
          >
            Spotify Auto
          </button>
          <button 
            className={`segment-btn ${mode === 'ytmusic' ? 'active' : ''}`}
            onClick={() => { setMode("ytmusic"); setSongData(null); setLyrics(null); }}
          >
            YT Music Manual
          </button>
        </div>
        
        {/* Right Side: Settings */}
        <button 
          className="icon-btn"
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
        >
          <GearIcon />
        </button>
      </div>

      {mode === "ytmusic" && (
        <form onSubmit={handleYTSearch} className="search-form">
          <input 
            type="text" 
            className="search-input"
            value={ytQuery}
            onChange={(e) => setYtQuery(e.target.value)}
            placeholder="Search song title & artist..."
          />
          <button type="submit" className="search-btn" disabled={ytLoading}>
            {ytLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      )}

      {ytError && <p style={{ color: '#ff4444' }}>{ytError}</p>}

      <TitleDisplay
        name={name}
        artist={artist}
        imageUrl={imageUrl}
        progress_ms={songData?.progress_ms || 0}
        formatTime={formatTime}
        hideTimer={mode === "ytmusic"}
      />
      <div style={{ WebkitAppRegion: 'no-drag', flex: 1, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scroll">
        <LyricsDisplay songData={songData || { progress_ms: 0 }} lyrics={lyrics} mode={mode} />
      </div>
    </div>
  );
}
export default App;
