/**
 * Domain Model: LyricLine
 * Single Responsibility: Represents a timed lyric line and resolves the active line index
 * using O(log N) binary search over sorted timestamps.
 */

export function createLyricLine(words, startTimeMs = 0) {
  return Object.freeze({
    words: String(words ?? '').trim(),
    startTimeMs: Math.max(0, Number(startTimeMs) || 0),
  })
}

export function findActiveLyricIndex(lyrics, progressMs = 0) {
  if (!Array.isArray(lyrics) || lyrics.length === 0 || progressMs <= 0) {
    return 0
  }

  let low = 0
  let high = lyrics.length - 1
  let result = 0

  while (low <= high) {
    const mid = (low + high) >>> 1
    const midTime = Number(lyrics[mid]?.startTimeMs) || 0

    if (midTime <= progressMs) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return result
}
