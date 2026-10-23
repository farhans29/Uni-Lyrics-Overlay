import { parseLrcLyrics, normalizeLyricsWithTiming } from '../services/lyricsParserService'

/**
 * Pure Utility Functions: Time Formatting & Polling Cadence
 */
function formatTime(ms) {
  if (!ms || ms < 0) return '0:00'
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

function getCallSpeed(tempo) {
  if (!tempo) return 500
  if (tempo > 120) return 300
  if (tempo > 100) return 400
  return 500
}

export { formatTime, getCallSpeed, parseLrcLyrics, normalizeLyricsWithTiming }
