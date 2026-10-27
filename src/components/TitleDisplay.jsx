import { memo } from 'react'
import { DEFAULT_TRACK_DURATION_MS } from '../domain/models/Track'
import { PlayIcon, PauseIcon, StopIcon, SyncIcon } from './icons/OverlayIcons'

/**
 * Presentational Component: Spotify Core Design Track Player & Transport Bar
 * Memoized to only re-render when track metadata or progress props change.
 */
const TitleDisplay = memo(function TitleDisplay({
  name,
  artist,
  imageUrl,
  progressMs = 0,
  durationMs = 0,
  isPlaying = false,
  showSyncButton = false,
  isLiveSyncLocked = true,
  isSyncing = false,
  onPlayPause,
  onStop,
  onSync,
  onSeek,
  formatTime,
}) {
  if (!name && !artist && !imageUrl) {
    if (!showSyncButton) return null

    return (
      <div className="song-card spotify-player-card empty-auto-card">
        <div className="empty-auto-row">
          <span className="empty-auto-label">Waiting for media session...</span>
          <button
            type="button"
            className={`spotify-sync-btn ${isSyncing ? 'syncing' : ''}`}
            onClick={onSync}
            title="Sync with currently playing media (Spotify, Apple Music, YouTube Music)"
          >
            <SyncIcon className={isSyncing ? 'spin-icon' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>
    )
  }

  const safeDuration = durationMs > 0 ? durationMs : DEFAULT_TRACK_DURATION_MS
  const clampedProgress = Math.min(Math.max(progressMs, 0), safeDuration)
  const progressPct = Math.min(100, Math.max(0, (clampedProgress / safeDuration) * 100))

  return (
    <div className="song-card spotify-player-card">
      <div className="song-info">
        {imageUrl && (
          <img
            src={decodeURIComponent(imageUrl)}
            alt="Album Cover"
            className="album-cover"
          />
        )}
        <div className="song-details">
          <div className="song-title-row">
            <h2 className="song-title">{name}</h2>
          </div>
          <p className="song-artist">{artist}</p>
        </div>
      </div>

      {/* Spotify Core Transport Controls */}
      <div className="playback-controls spotify-transport">
        <div className="playback-buttons spotify-buttons-row">
          <button
            type="button"
            className="spotify-icon-control stop-btn"
            onClick={onStop}
            title="Stop & Reset to 0:00"
            aria-label="Stop Lyrics"
          >
            <StopIcon />
          </button>

          <button
            type="button"
            className={`spotify-play-circle ${isPlaying ? 'playing' : ''}`}
            onClick={onPlayPause}
            title={isPlaying ? 'Pause Lyrics' : 'Play Lyrics'}
            aria-label={isPlaying ? 'Pause Lyrics' : 'Play Lyrics'}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>

          {showSyncButton ? (
            <button
              type="button"
              className={`spotify-sync-btn ${isLiveSyncLocked ? 'live-locked' : ''} ${
                isSyncing ? 'syncing' : ''
              }`}
              onClick={onSync}
              title="Re-sync lyrics timestamp with active Windows media player"
              aria-label="Sync with active song"
            >
              <SyncIcon className={isSyncing ? 'spin-icon' : ''} />
              <span>{isSyncing ? 'Syncing' : 'Sync'}</span>
            </button>
          ) : (
            <div className="spotify-control-spacer" aria-hidden="true" />
          )}
        </div>

        <div className="playback-scrubber spotify-scrubber">
          <span className="song-progress">{formatTime(clampedProgress)}</span>
          <input
            type="range"
            className="progress-slider spotify-progress-bar"
            style={{ '--progress-pct': `${progressPct}%` }}
            min={0}
            max={safeDuration}
            step={100}
            value={clampedProgress}
            onChange={(e) => onSeek?.(Number(e.target.value))}
            aria-label="Lyrics timeline progress"
          />
          <span className="song-progress">{formatTime(safeDuration)}</span>
        </div>
      </div>
    </div>
  )
})

export default TitleDisplay
