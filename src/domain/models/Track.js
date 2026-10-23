/**
 * Domain Model: Track
 * Single Responsibility: Represents a normalized music track across all sources
 * (Windows System Media, YouTube Music, and Spotify Web API).
 */

export const DEFAULT_TRACK_DURATION_MS = 180000

export function createTrack({
  id = '',
  name = '',
  artist = '',
  imageUrl = '',
  durationMs = DEFAULT_TRACK_DURATION_MS,
  source = 'unknown',
} = {}) {
  return Object.freeze({
    id: String(id || ''),
    name: String(name || ''),
    artist: String(artist || ''),
    imageUrl: String(imageUrl || ''),
    durationMs: Number(durationMs) > 0 ? Number(durationMs) : DEFAULT_TRACK_DURATION_MS,
    source: String(source || 'unknown'),
  })
}

export function createTrackFromSpotify(spotifyPlayback) {
  const item = spotifyPlayback?.item
  if (!item) return null

  return createTrack({
    id: item.id,
    name: item.name,
    artist: item.artists?.map((a) => a.name).join(', ') || '',
    imageUrl: item.album?.images?.[0]?.url || '',
    durationMs: item.duration_ms || DEFAULT_TRACK_DURATION_MS,
    source: 'spotify',
  })
}

export function createTrackFromYTMusic(ytSong, overrides = {}) {
  if (!ytSong) return null

  const rawDurationMs = ytSong.duration ? ytSong.duration * 1000 : DEFAULT_TRACK_DURATION_MS
  return createTrack({
    id: ytSong.videoId || overrides.id || '',
    name: overrides.name || ytSong.name || '',
    artist: overrides.artist || ytSong.artist?.name || '',
    imageUrl: ytSong.thumbnails?.[0]?.url || overrides.imageUrl || '',
    durationMs: overrides.durationMs || rawDurationMs,
    source: overrides.source || 'ytmusic',
  })
}

export function createTrackFromSystemMedia(media) {
  if (!media || !media.active || !media.title) return null

  return createTrack({
    id: `${media.title}:::${media.artist || ''}`,
    name: media.title,
    artist: media.artist || media.source || 'Unknown Artist',
    imageUrl: '',
    durationMs: media.durationMs > 0 ? media.durationMs : DEFAULT_TRACK_DURATION_MS,
    source: 'system',
  })
}

export function getTrackSignature(title, artist) {
  return `${String(title || '').trim()}:::${String(artist || '').trim()}`
}
