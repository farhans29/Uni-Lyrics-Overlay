import { useEffect, useRef, useState } from 'react'

function LyricsDisplay({ songData, lyrics, mode }) {
  const lyricsRef = useRef(null)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)

  useEffect(() => {
    if (!lyrics || lyrics.length === 0 || !songData?.progress_ms) return

    // Find the closest lyric that matches song progress
    let currentIndex = lyrics.findIndex(
      (line, index) =>
        songData.progress_ms >= line.startTimeMs &&
        (index === lyrics.length - 1 || songData.progress_ms < lyrics[index + 1].startTimeMs)
    )

    if (currentIndex === -1) {
      setCurrentLyricIndex(0)
    } else {
      setCurrentLyricIndex(currentIndex)
    }
  }, [songData?.progress_ms, lyrics])

  useEffect(() => {
    if (lyricsRef.current) {
      const lyricElements = lyricsRef.current.children

      if (lyricElements[currentLyricIndex]) {
        lyricElements[currentLyricIndex].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentLyricIndex])

  return (
    <div className="lyrics-box" ref={lyricsRef}>
      {lyrics === null ? (
        <p className="lyrics-line" style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
          {mode === 'ytmusic' ? 'Please search the song lyrics first' : 'Waiting for Spotify track...'}
        </p>
      ) : (
        lyrics.map((line, index) => (
          <p key={index} className={`lyrics-line ${index === currentLyricIndex ? 'active' : ''}`}>
            {line.words}
          </p>
        ))
      )}
    </div>
  )
}
export { LyricsDisplay }
