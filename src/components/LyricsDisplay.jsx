import { memo, useEffect, useRef, useCallback } from 'react'
import { OVERLAY_MODES } from '../domain/models/OverlaySettings'

/**
 * Presentational Component: Synced & Auto-Scrolling Lyrics Viewport
 * Memoized on `activeLyricIndex` & `lyrics` so 10Hz timer ticks do NOT re-render all lyric DOM nodes.
 * Uses event delegation on the container to avoid allocating closures per lyric line.
 */
const LyricsDisplay = memo(function LyricsDisplay({
  activeLyricIndex = 0,
  lyrics,
  mode,
  loading = false,
  onSeekLine,
}) {
  const lyricsRef = useRef(null)

  useEffect(() => {
    if (!lyricsRef.current || !lyrics || lyrics.length === 0) return

    const lyricElements = lyricsRef.current.children
    if (lyricElements[activeLyricIndex]) {
      lyricElements[activeLyricIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [activeLyricIndex, lyrics])

  const handleContainerClick = useCallback(
    (e) => {
      const lineEl = e.target.closest('[data-start-ms]')
      if (lineEl && onSeekLine) {
        onSeekLine(Number(lineEl.dataset.startMs) || 0)
      }
    },
    [onSeekLine]
  )

  const getPlaceholderText = () => {
    if (loading) return 'Fetching synced lyrics...'
    if (mode === OVERLAY_MODES.YTMUSIC) return 'Please search the song lyrics first'
    if (mode === OVERLAY_MODES.AUTO) {
      return 'Play any song in Chrome, YT Music, or Spotify to auto-detect...'
    }
    return 'Waiting for Spotify track...'
  }

  return (
    <div className="lyrics-box" ref={lyricsRef} onClick={handleContainerClick}>
      {lyrics === null ? (
        <p className="lyrics-line" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          {getPlaceholderText()}
        </p>
      ) : (
        lyrics.map((line, index) => (
          <p
            key={index}
            data-start-ms={line.startTimeMs}
            className={`lyrics-line ${index === activeLyricIndex ? 'active' : ''}`}
            title="Click to jump to this lyric line"
          >
            {line.words}
          </p>
        ))
      )}
    </div>
  )
})

export { LyricsDisplay }
