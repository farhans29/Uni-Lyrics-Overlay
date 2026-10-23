import { useState, useCallback } from 'react'
import { searchTrackAndLyrics } from '../services/mediaProviderService'

/**
 * Presentation Hook: YouTube Music & LRCLIB Lyrics Query State
 * Single Responsibility: Wraps searchTrackAndLyrics with reactive loading and error states.
 */
export function useYTMusicAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLyrics = useCallback(async (query) => {
    if (!query) return null

    setLoading(true)
    setError(null)

    try {
      return await searchTrackAndLyrics(query)
    } catch (err) {
      console.error('Error fetching YT Music lyrics:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchLyrics, loading, error }
}
