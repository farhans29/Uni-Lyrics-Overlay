import { memo } from 'react'
import { OVERLAY_MODES } from '../domain/models/OverlaySettings'
import { desktopWindowService } from '../services/mediaProviderService'
import { CloseIcon, MinimizeIcon, GearIcon, EyeOffIcon } from './icons/OverlayIcons'

/**
 * Presentational Component: Top Frosted Control Bar
 * Memoized so high-frequency player ticks never re-render the header bar.
 */
const ControlBar = memo(function ControlBar({
  mode,
  onModeChange,
  onToggleLyricsOnly,
  onOpenSettings,
}) {
  return (
    <div className="control-bar">
      <div className="window-controls">
        <button
          className="icon-btn window-btn close-btn"
          onClick={() =>
            desktopWindowService
              .closeWindow()
              .catch((err) => console.error('Close error:', err))
          }
          title="Close"
        >
          <CloseIcon />
        </button>
        <button
          className="icon-btn window-btn min-btn"
          onClick={() =>
            desktopWindowService
              .minimizeWindow()
              .catch((err) => console.error('Minimize error:', err))
          }
          title="Minimize"
        >
          <MinimizeIcon />
        </button>
      </div>

      <div className="segmented-control">
        <button
          className={`segment-btn ${mode === OVERLAY_MODES.AUTO ? 'active spotify-mode' : ''}`}
          onClick={() => onModeChange(OVERLAY_MODES.AUTO)}
          title="Auto-detect song from Windows (Chrome, YT Music, Spotify, etc.)"
        >
          Auto Detect
        </button>
        <button
          className={`segment-btn ${mode === OVERLAY_MODES.YTMUSIC ? 'active ytmusic-mode' : ''}`}
          onClick={() => onModeChange(OVERLAY_MODES.YTMUSIC)}
          title="Manually search song on YouTube Music"
        >
          Manual
        </button>
      </div>

      <div className="control-actions">
        <button
          className="icon-btn hide-ui-btn"
          onClick={onToggleLyricsOnly}
          title="Lyrics-Only Mode (Hide top bar & player)"
          aria-label="Hide top bar and player"
        >
          <EyeOffIcon />
        </button>
        <button className="icon-btn" onClick={onOpenSettings} title="Settings">
          <GearIcon />
        </button>
      </div>
    </div>
  )
})

export default ControlBar
