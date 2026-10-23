/**
 * Infrastructure Adapter: Media Provider & Desktop Window Gateway
 * Dependency Inversion Principle: Abstracts Electron IPC vs Web HTTP fallback behind a clean service interface.
 */

export async function searchTrackAndLyrics(query) {
  if (!query || !String(query).trim()) return null

  if (window.electronAPI?.searchYTLyrics) {
    const result = await window.electronAPI.searchYTLyrics(query)
    if (result?.error) {
      throw new Error(result.error)
    }
    return result
  }

  const response = await fetch(`/api/lyrics?query=${encodeURIComponent(query)}`)
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to fetch lyrics')
  }

  return response.json()
}

export async function fetchSystemMediaSession() {
  if (window.electronAPI?.getSystemMedia) {
    return window.electronAPI.getSystemMedia()
  }

  const response = await fetch('/api/system-media')
  if (!response.ok) {
    return { active: false }
  }
  return response.json()
}

export async function fetchSpotifyTrackLyricsAndAudio(trackId, bearerToken, signal) {
  const [lyricsRes, audioRes] = await Promise.all([
    fetch(
      `https://spclient.wg.spotify.com/color-lyrics/v2/track/${trackId}?format=json&market=from_token`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'App-Platform': 'WebPlayer',
        },
        signal,
      }
    ),
    fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'App-Platform': 'WebPlayer',
      },
      signal,
    }),
  ])

  const lyricsData = await lyricsRes.json()
  const audioData = await audioRes.json()

  return {
    lines: lyricsData?.lyrics?.lines || null,
    audioData,
  }
}

export const desktopWindowService = Object.freeze({
  async closeWindow() {
    if (window.electronAPI?.closeWindow) {
      await window.electronAPI.closeWindow()
    }
  },
  async minimizeWindow() {
    if (window.electronAPI?.minimizeWindow) {
      await window.electronAPI.minimizeWindow()
    }
  },
  async setAlwaysOnTop(pinned) {
    if (window.electronAPI?.setAlwaysOnTop) {
      await window.electronAPI.setAlwaysOnTop(Boolean(pinned))
    }
  },
})
