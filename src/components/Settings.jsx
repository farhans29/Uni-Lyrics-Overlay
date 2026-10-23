import { useState, useRef, useEffect } from 'react'
import { OVERLAY_THEMES, CORE_FONT_PRESETS } from '../domain/models/OverlaySettings'
import { ChevronDownIcon } from './icons/OverlayIcons'
import Versions from './Versions'

/**
 * Presentational Component: Settings Modal
 * Single Responsibility: Renders theme dropdown, font-family dropdown, transparency slider,
 * pinned-window toggle, lyrics-only toggle, album-cover background toggles, and version badge.
 */
function Settings({
  theme,
  setTheme,
  fontFamily,
  setFontFamily,
  availableFonts = CORE_FONT_PRESETS,
  transparency,
  setTransparency,
  pinned,
  setPinned,
  lyricsOnly,
  setLyricsOnly,
  albumArtBg,
  setAlbumArtBg,
  albumArtPic,
  setAlbumArtPic,
  onSave,
  onClose,
}) {
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isFontOpen, setIsFontOpen] = useState(false)
  const themeDropdownRef = useRef(null)
  const fontDropdownRef = useRef(null)

  const handleOverlayClick = (e) => {
    if (e.target.className === 'settings-overlay') {
      onClose()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setIsThemeOpen(false)
      }
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target)) {
        setIsFontOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentTheme = OVERLAY_THEMES.find((t) => t.value === theme) || OVERLAY_THEMES[0]
  const currentFont =
    availableFonts.find((f) => f.value === fontFamily) || availableFonts[0] || CORE_FONT_PRESETS[0]
  const clampedTransparency = Math.min(100, Math.max(0, Number(transparency) || 0))

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className={`settings-modal ${theme === 'light' ? 'light-settings' : ''}`}>
        <div className="settings-header">
          <h2>Settings</h2>
          <Versions />
        </div>

        <div className="settings-row-grid">
          <div className="settings-group">
            <label>Theme</label>
            <div className="custom-dropdown" ref={themeDropdownRef}>
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setIsThemeOpen(!isThemeOpen)
                  setIsFontOpen(false)
                }}
              >
                <span className="dropdown-icon">{currentTheme.icon}</span>
                <span className="dropdown-label">{currentTheme.label}</span>
                <ChevronDownIcon className={`dropdown-chevron ${isThemeOpen ? 'open' : ''}`} />
              </button>
              {isThemeOpen && (
                <div className="dropdown-menu">
                  {OVERLAY_THEMES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`dropdown-item ${theme === t.value ? 'active' : ''}`}
                      onClick={() => {
                        setTheme(t.value)
                        setIsThemeOpen(false)
                      }}
                    >
                      <span className="dropdown-icon">{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="settings-group">
            <label>Font Type</label>
            <div className="custom-dropdown" ref={fontDropdownRef}>
              <button
                type="button"
                className="dropdown-trigger"
                onClick={() => {
                  setIsFontOpen(!isFontOpen)
                  setIsThemeOpen(false)
                }}
              >
                <span className="dropdown-icon">Aa</span>
                <span
                  className="dropdown-label dropdown-label-truncate"
                  style={{ fontFamily: currentFont.value }}
                >
                  {currentFont.label}
                </span>
                <ChevronDownIcon className={`dropdown-chevron ${isFontOpen ? 'open' : ''}`} />
              </button>
              {isFontOpen && (
                <div className="dropdown-menu font-dropdown-menu">
                  {availableFonts.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      className={`dropdown-item font-dropdown-item ${
                        fontFamily === f.value ? 'active' : ''
                      }`}
                      style={{ fontFamily: f.value }}
                      onClick={() => {
                        setFontFamily(f.value)
                        setIsFontOpen(false)
                      }}
                    >
                      <span className="font-item-name">{f.label}</span>
                      {f.category && <span className="font-item-badge">{f.category}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-label-row">
            <label htmlFor="transparency-slider">Background Transparency</label>
            <span className="settings-value-pill">{clampedTransparency}%</span>
          </div>
          <input
            type="range"
            id="transparency-slider"
            className="settings-range-slider"
            style={{ '--slider-pct': `${clampedTransparency}%` }}
            min="0"
            max="100"
            value={clampedTransparency}
            onChange={(e) => setTransparency(Number(e.target.value))}
          />
        </div>

        <div className="settings-toggles-list">
          <div className="settings-toggle-row">
            <label htmlFor="album-pic-toggle">Album Art Picture Background</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="album-pic-toggle"
                checked={albumArtPic}
                onChange={(e) => setAlbumArtPic(e.target.checked)}
              />
              <label htmlFor="album-pic-toggle" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-toggle-row">
            <label htmlFor="album-bg-toggle">Match Album Cover Color Glow</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="album-bg-toggle"
                checked={albumArtBg}
                onChange={(e) => setAlbumArtBg(e.target.checked)}
              />
              <label htmlFor="album-bg-toggle" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-toggle-row">
            <label htmlFor="pinned-toggle">Pinned Window (Always on Top)</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="pinned-toggle"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              <label htmlFor="pinned-toggle" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-toggle-row">
            <label htmlFor="lyrics-only-toggle">Lyrics-Only Mode (Hide Player)</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="lyrics-only-toggle"
                checked={lyricsOnly}
                onChange={(e) => setLyricsOnly(e.target.checked)}
              />
              <label htmlFor="lyrics-only-toggle" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-save" onClick={onSave}>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
