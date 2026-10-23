import {
  createOverlaySettings,
  DEFAULT_OVERLAY_SETTINGS,
  OVERLAY_MODES,
  CORE_FONT_PRESETS,
  CANDIDATE_PC_FONTS,
} from '../domain/models/OverlaySettings'

/**
 * Infrastructure Adapter: Overlay Settings Persistence & DOM Sync
 * Single Responsibility: Reads/writes user preferences, detects installed PC fonts,
 * and applies theme/transparency/font CSS variables.
 */

const STORAGE_KEYS = Object.freeze({
  THEME: 'theme',
  TRANSPARENCY: 'transparency',
  PINNED: 'pinned',
  LYRICS_ONLY: 'lyrics_only',
  ALBUM_ART_BG: 'album_art_bg',
  ALBUM_ART_PIC: 'album_art_pic',
  FONT_FAMILY: 'font_family',
})

export function loadStoredSettings() {
  const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME)
  const storedTransparency = localStorage.getItem(STORAGE_KEYS.TRANSPARENCY)
  const storedPinned = localStorage.getItem(STORAGE_KEYS.PINNED)
  const storedLyricsOnly = localStorage.getItem(STORAGE_KEYS.LYRICS_ONLY)
  const storedAlbumArtBg = localStorage.getItem(STORAGE_KEYS.ALBUM_ART_BG)
  const storedAlbumArtPic = localStorage.getItem(STORAGE_KEYS.ALBUM_ART_PIC)
  const storedFontFamily = localStorage.getItem(STORAGE_KEYS.FONT_FAMILY)

  return createOverlaySettings({
    theme: storedTheme || DEFAULT_OVERLAY_SETTINGS.theme,
    transparency:
      storedTransparency !== null
        ? Number(storedTransparency)
        : DEFAULT_OVERLAY_SETTINGS.transparency,
    pinned: storedPinned === null ? DEFAULT_OVERLAY_SETTINGS.pinned : storedPinned !== 'false',
    lyricsOnly:
      storedLyricsOnly === null
        ? DEFAULT_OVERLAY_SETTINGS.lyricsOnly
        : storedLyricsOnly === 'true',
    albumArtBg:
      storedAlbumArtBg === null
        ? DEFAULT_OVERLAY_SETTINGS.albumArtBg
        : storedAlbumArtBg === 'true',
    albumArtPic:
      storedAlbumArtPic === null
        ? DEFAULT_OVERLAY_SETTINGS.albumArtPic
        : storedAlbumArtPic === 'true',
    fontFamily: storedFontFamily || DEFAULT_OVERLAY_SETTINGS.fontFamily,
  })
}

export function persistSettings(settings) {
  const normalized = createOverlaySettings(settings)
  localStorage.setItem(STORAGE_KEYS.THEME, normalized.theme)
  localStorage.setItem(STORAGE_KEYS.TRANSPARENCY, String(normalized.transparency))
  localStorage.setItem(STORAGE_KEYS.PINNED, String(normalized.pinned))
  localStorage.setItem(STORAGE_KEYS.LYRICS_ONLY, String(normalized.lyricsOnly))
  localStorage.setItem(STORAGE_KEYS.ALBUM_ART_BG, String(normalized.albumArtBg))
  localStorage.setItem(STORAGE_KEYS.ALBUM_ART_PIC, String(normalized.albumArtPic))
  localStorage.setItem(STORAGE_KEYS.FONT_FAMILY, String(normalized.fontFamily))
  return normalized
}

export function applyVisualThemeToDocument({ theme, transparency, mode, fontFamily }) {
  if (typeof document === 'undefined') return

  if (typeof transparency === 'number') {
    document.body.style.setProperty('--bg-alpha', (transparency / 100).toString())
  }

  if (fontFamily) {
    document.documentElement.style.setProperty('--app-font-family', fontFamily)
    document.body.style.setProperty('--app-font-family', fontFamily)
  }

  if (theme) {
    document.body.classList.toggle('light-theme', theme === 'light')
  }

  if (mode) {
    document.body.classList.toggle('ytmusic-theme', mode === OVERLAY_MODES.YTMUSIC)
    document.body.classList.toggle(
      'spotify-theme',
      mode === OVERLAY_MODES.SPOTIFY || mode === OVERLAY_MODES.AUTO
    )
  }
}

/**
 * Detects whether a specific font family is installed on the user's PC
 * using canvas glyph width comparison against baseline generic families.
 */
function isFontInstalledOnPC(fontName) {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return true

    const sampleText = 'mmmmmmmmmmlliWW1234567890'
    const baseFonts = ['monospace', 'sans-serif', 'serif']
    const baseWidths = {}

    for (const base of baseFonts) {
      ctx.font = `72px ${base}`
      baseWidths[base] = ctx.measureText(sampleText).width
    }

    for (const base of baseFonts) {
      ctx.font = `72px "${fontName}", ${base}`
      const measured = ctx.measureText(sampleText).width
      if (measured !== baseWidths[base]) {
        return true
      }
    }
    return false
  } catch {
    return true
  }
}

let cachedFontOptions = null

export function getAvailableFontOptions() {
  if (cachedFontOptions) return cachedFontOptions

  const detectedPCFonts = []
  for (const item of CANDIDATE_PC_FONTS) {
    if (isFontInstalledOnPC(item.family)) {
      detectedPCFonts.push({
        value: `"${item.family}", ${item.fallback}`,
        label: item.family,
        category: item.category,
      })
    }
  }

  cachedFontOptions = [...CORE_FONT_PRESETS, ...detectedPCFonts]
  return cachedFontOptions
}
