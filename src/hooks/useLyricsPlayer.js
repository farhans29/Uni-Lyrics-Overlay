import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_TRACK_DURATION_MS } from '../domain/models/Track'

/**
 * Presentation Controller Hook: Lyrics Playback Timeline Engine
 * Single Responsibility: Manages play/pause/stop state, high-resolution timer ticks, and manual seeking.
 */
export function useLyricsPlayer(hasLyrics = false) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [progressMs, setProgressMs] = useState(0)
  const [durationMs, setDurationMs] = useState(DEFAULT_TRACK_DURATION_MS)
  const [isManualOverride, setIsManualOverride] = useState(false)

  const manualOverrideRef = useRef(false)
  const lastTickRef = useRef(null)

  useEffect(() => {
    if (!isPlaying || !hasLyrics) {
      lastTickRef.current = null
      return
    }

    lastTickRef.current = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      const delta = now - (lastTickRef.current || now)
      lastTickRef.current = now

      setProgressMs((prev) => {
        const next = prev + delta
        if (durationMs > 0 && next >= durationMs) {
          setIsPlaying(false)
          return durationMs
        }
        return next
      })
    }, 100)

    return () => clearInterval(timer)
  }, [isPlaying, hasLyrics, durationMs])

  const togglePlayPause = useCallback(() => {
    if (!hasLyrics) return
    manualOverrideRef.current = true
    setIsManualOverride(true)
    setProgressMs((prev) => (prev >= durationMs ? 0 : prev))
    setIsPlaying((prev) => !prev)
  }, [hasLyrics, durationMs])

  const stop = useCallback(() => {
    manualOverrideRef.current = true
    setIsManualOverride(true)
    setIsPlaying(false)
    setProgressMs(0)
  }, [])

  const seek = useCallback(
    (newTimeMs) => {
      manualOverrideRef.current = true
      setIsManualOverride(true)
      setProgressMs(Math.max(0, Math.min(Number(newTimeMs) || 0, durationMs)))
    },
    [durationMs]
  )

  const resetPlayer = useCallback((initialDurationMs = DEFAULT_TRACK_DURATION_MS) => {
    manualOverrideRef.current = false
    setIsManualOverride(false)
    setIsPlaying(false)
    setProgressMs(0)
    setDurationMs(initialDurationMs > 0 ? initialDurationMs : DEFAULT_TRACK_DURATION_MS)
  }, [])

  const startFromBeginning = useCallback((trackDurationMs = DEFAULT_TRACK_DURATION_MS) => {
    manualOverrideRef.current = false
    setIsManualOverride(false)
    setDurationMs(trackDurationMs > 0 ? trackDurationMs : DEFAULT_TRACK_DURATION_MS)
    setProgressMs(0)
    setIsPlaying(true)
  }, [])

  const syncExternalPlayback = useCallback(
    ({ positionMs, trackDurationMs, playing, force = false }) => {
      if (!force && manualOverrideRef.current) return

      if (force) {
        manualOverrideRef.current = false
        setIsManualOverride(false)
      }
      if (typeof playing === 'boolean') {
        setIsPlaying(playing)
      }
      if (trackDurationMs && trackDurationMs > 0) {
        setDurationMs(trackDurationMs)
      }
      if (typeof positionMs === 'number' && positionMs >= 0) {
        setProgressMs((prev) =>
          force || Math.abs(prev - positionMs) > 1500 ? positionMs : prev
        )
      }
    },
    []
  )

  return {
    isPlaying,
    progressMs,
    durationMs,
    isManualOverride,
    setDurationMs,
    togglePlayPause,
    stop,
    seek,
    resetPlayer,
    startFromBeginning,
    syncExternalPlayback,
  }
}
