/**
 * Domain Model: OverlaySettings & Modes
 * Single Responsibility: Defines valid overlay modes, themes, fonts, and user preference invariants.
 */

export const OVERLAY_MODES = Object.freeze({
  AUTO: 'auto',
  YTMUSIC: 'ytmusic',
  SPOTIFY: 'spotify',
})

export const OVERLAY_THEMES = Object.freeze([
  { value: 'dark', label: 'Dark', icon: '\u25d1' },
  { value: 'light', label: 'Light', icon: '\u25d0' },
])

export const DEFAULT_FONT_FAMILY =
  '"Inter Tight", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

export const CORE_FONT_PRESETS = Object.freeze([
  {
    value: DEFAULT_FONT_FAMILY,
    label: 'Default (Inter Tight)',
    category: 'Sans-Serif',
  },
  {
    value: 'sans-serif',
    label: 'Sans-Serif',
    category: 'System Generic',
  },
  {
    value: 'serif',
    label: 'Serif',
    category: 'System Generic',
  },
  {
    value: '"Roboto", "Segoe UI", sans-serif',
    label: 'Roboto',
    category: 'Sans-Serif',
  },
  {
    value: 'monospace',
    label: 'Monospace',
    category: 'System Generic',
  },
])

export const CANDIDATE_PC_FONTS = Object.freeze([
  { family: 'Segoe UI', fallback: 'sans-serif', category: 'Windows Sans' },
  { family: 'Arial', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Calibri', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Verdana', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Trebuchet MS', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Tahoma', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Century Gothic', fallback: 'sans-serif', category: 'Geometric Sans' },
  { family: 'Candara', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Franklin Gothic Medium', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Bahnschrift', fallback: 'sans-serif', category: 'Sans-Serif' },
  { family: 'Georgia', fallback: 'serif', category: 'Serif' },
  { family: 'Times New Roman', fallback: 'serif', category: 'Serif' },
  { family: 'Cambria', fallback: 'serif', category: 'Serif' },
  { family: 'Garamond', fallback: 'serif', category: 'Serif' },
  { family: 'Palatino Linotype', fallback: 'serif', category: 'Serif' },
  { family: 'Constantia', fallback: 'serif', category: 'Serif' },
  { family: 'Consolas', fallback: 'monospace', category: 'Monospace' },
  { family: 'Cascadia Code', fallback: 'monospace', category: 'Monospace' },
  { family: 'Courier New', fallback: 'monospace', category: 'Monospace' },
  { family: 'Comic Sans MS', fallback: 'cursive, sans-serif', category: 'Casual' },
  { family: 'Impact', fallback: 'sans-serif', category: 'Display' },
])

export const DEFAULT_OVERLAY_SETTINGS = Object.freeze({
  theme: 'dark',
  transparency: 60,
  pinned: true,
  lyricsOnly: false,
  albumArtBg: false,
  albumArtPic: false,
  fontFamily: DEFAULT_FONT_FAMILY,
})

export function createOverlaySettings(partial = {}) {
  const theme = partial.theme === 'light' ? 'light' : 'dark'
  const rawTransparency =
    partial.transparency !== undefined && partial.transparency !== null
      ? Number(partial.transparency)
      : DEFAULT_OVERLAY_SETTINGS.transparency
  const transparency = Number.isFinite(rawTransparency)
    ? Math.min(100, Math.max(0, rawTransparency))
    : DEFAULT_OVERLAY_SETTINGS.transparency
  const pinned =
    typeof partial.pinned === 'boolean' ? partial.pinned : DEFAULT_OVERLAY_SETTINGS.pinned
  const lyricsOnly =
    typeof partial.lyricsOnly === 'boolean'
      ? partial.lyricsOnly
      : DEFAULT_OVERLAY_SETTINGS.lyricsOnly
  const albumArtBg =
    typeof partial.albumArtBg === 'boolean'
      ? partial.albumArtBg
      : DEFAULT_OVERLAY_SETTINGS.albumArtBg
  const albumArtPic =
    typeof partial.albumArtPic === 'boolean'
      ? partial.albumArtPic
      : DEFAULT_OVERLAY_SETTINGS.albumArtPic
  const fontFamily =
    typeof partial.fontFamily === 'string' && partial.fontFamily.trim().length > 0
      ? partial.fontFamily.trim()
      : DEFAULT_OVERLAY_SETTINGS.fontFamily

  return Object.freeze({
    theme,
    transparency,
    pinned,
    lyricsOnly,
    albumArtBg,
    albumArtPic,
    fontFamily,
  })
}
