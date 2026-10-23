import { useState, useEffect, useCallback } from 'react'
import {
  loadStoredSettings,
  persistSettings,
  applyVisualThemeToDocument,
  getAvailableFontOptions,
} from '../services/settingsStorageService'
import { desktopWindowService } from '../services/mediaProviderService'

/**
 * Presentation Controller Hook: Overlay Settings & Window Preferences
 * Single Responsibility: Manages theme, transparency, font family, lyrics-only mode,
 * album-art backgrounds, and window-pinning state.
 */
export function useOverlaySettings(mode) {
  const [initial] = useState(() => loadStoredSettings())
  const [availableFonts] = useState(() => getAvailableFontOptions())

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [theme, setTheme] = useState(initial.theme)
  const [transparency, setTransparency] = useState(initial.transparency)
  const [pinned, setPinned] = useState(initial.pinned)
  const [lyricsOnly, setLyricsOnly] = useState(initial.lyricsOnly)
  const [albumArtBg, setAlbumArtBg] = useState(initial.albumArtBg)
  const [albumArtPic, setAlbumArtPic] = useState(initial.albumArtPic)
  const [fontFamily, setFontFamily] = useState(initial.fontFamily)

  useEffect(() => {
    desktopWindowService
      .setAlwaysOnTop(initial.pinned)
      .catch((err) => console.error('Error setting always on top:', err))
  }, [initial.pinned])

  useEffect(() => {
    applyVisualThemeToDocument({ theme, transparency, mode, fontFamily })
  }, [theme, transparency, mode, fontFamily])

  const openSettings = useCallback(() => setIsSettingsOpen(true), [])
  const closeSettings = useCallback(() => setIsSettingsOpen(false), [])

  const toggleLyricsOnly = useCallback(() => {
    setLyricsOnly((prev) => {
      const next = !prev
      persistSettings({
        theme,
        transparency,
        pinned,
        lyricsOnly: next,
        albumArtBg,
        albumArtPic,
        fontFamily,
      })
      return next
    })
  }, [theme, transparency, pinned, albumArtBg, albumArtPic, fontFamily])

  const saveSettings = useCallback(() => {
    const saved = persistSettings({
      theme,
      transparency,
      pinned,
      lyricsOnly,
      albumArtBg,
      albumArtPic,
      fontFamily,
    })
    desktopWindowService
      .setAlwaysOnTop(saved.pinned)
      .catch((err) => console.error('Error setting always on top:', err))
    setIsSettingsOpen(false)
  }, [theme, transparency, pinned, lyricsOnly, albumArtBg, albumArtPic, fontFamily])

  return {
    theme,
    setTheme,
    transparency,
    setTransparency,
    pinned,
    setPinned,
    lyricsOnly,
    setLyricsOnly,
    toggleLyricsOnly,
    albumArtBg,
    setAlbumArtBg,
    albumArtPic,
    setAlbumArtPic,
    fontFamily,
    setFontFamily,
    availableFonts,
    isSettingsOpen,
    openSettings,
    closeSettings,
    saveSettings,
  }
}
