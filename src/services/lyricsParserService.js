import { createLyricLine } from '../domain/models/LyricLine'
import { DEFAULT_TRACK_DURATION_MS } from '../domain/models/Track'

/**
 * Application Service: Lyrics Parser & Timing Normalizer
 * Single Responsibility: Parses raw LRC strings or plain lyric arrays into timed LyricLine domain entities.
 */

export function parseLrcLyrics(lrcString) {
  if (!lrcString || typeof lrcString !== 'string') return null

  const lines = lrcString.split(/\r?\n/)
  const parsed = []
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g

  for (const rawLine of lines) {
    const matches = [...rawLine.matchAll(timeRegex)]
    if (matches.length === 0) continue

    const words = rawLine.replace(timeRegex, '').trim()
    for (const match of matches) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const fractionStr = (match[3] || '0').padEnd(3, '0').slice(0, 3)
      const milliseconds = parseInt(fractionStr, 10)
      const startTimeMs = minutes * 60000 + seconds * 1000 + milliseconds

      parsed.push(createLyricLine(words || '♪', startTimeMs))
    }
  }

  parsed.sort((a, b) => a.startTimeMs - b.startTimeMs)
  return parsed.length > 0 ? parsed : null
}

export function normalizeLyricsWithTiming(rawLyrics, durationMs = DEFAULT_TRACK_DURATION_MS) {
  if (!rawLyrics) return null

  if (typeof rawLyrics === 'string' && /\[\d{1,2}:\d{2}/.test(rawLyrics)) {
    const lrcParsed = parseLrcLyrics(rawLyrics)
    if (lrcParsed) return lrcParsed
  }

  let lines = []
  if (typeof rawLyrics === 'string') {
    lines = rawLyrics
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((words) => createLyricLine(words, 0))
  } else if (Array.isArray(rawLyrics)) {
    lines = rawLyrics
      .map((item) => {
        if (typeof item === 'string') {
          return createLyricLine(item, 0)
        }
        return createLyricLine(item.words ?? item.text ?? '', item.startTimeMs ?? item.time ?? 0)
      })
      .filter((item) => item.words.length > 0)
  }

  if (lines.length === 0) return null

  const hasRealTimestamps = lines.some((line) => line.startTimeMs > 0)
  if (hasRealTimestamps) {
    return lines
  }

  const totalMs = durationMs > 0 ? durationMs : lines.length * 3500
  const usableMs = Math.max(totalMs * 0.92, 1000)
  const stepMs = usableMs / Math.max(lines.length, 1)

  return lines.map((line, index) => createLyricLine(line.words, Math.round(index * stepMs)))
}
