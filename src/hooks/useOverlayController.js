import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  DEFAULT_TRACK_DURATION_MS,
  createTrackFromSpotify,
  createTrackFromYTMusic,
  createTrackFromSystemMedia,
  getTrackSignature,
} from '../domain/models/Track'
import { findActiveLyricIndex } from '../domain/models/LyricLine'
import { OVERLAY_MODES } from '../domain/models/OverlaySettings'
import { normalizeLyricsWithTiming } from '../services/lyricsParserService'
import {
  fetchSystemMediaSession,
  fetchSpotifyTrackLyricsAndAudio,
} from '../services/mediaProviderService'
import { getCallSpeed } from '../util/helperFunctions'
import { useSpotifyAuth } from './useSpotifyAuth'
import { useYTMusicAuth } from './useYTMusicAuth'
import { useLyricsPlayer } from './useLyricsPlayer'

const BEARER_TOKEN = import.meta.env.VITE_BEARER_TOKEN

/**
 * Application Use-Case Controller Hook: Overlay Orchestrator
 * Coordinates track detection (Auto / Manual / Spotify), lyrics resolution, and timeline playback.
 */
export function useOverlayController() {
  const [mode, setMode] = useState(OVERLAY_MODES.AUTO)
  const [ytQuery, setYtQuery] = useState('')

  const [track, setTrack] = useState(null)
  const [songAudioData, setSongAudioData] = useState(null)
  const [lyrics, setLyrics] = useState(null)
  const [isSynced, setIsSynced] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const spotifyIntervalRef = useRef(null)
  const lastTrackIdRef = useRef(null)
  const lastAutoTrackKeyRef = useRef(null)
  const abortControllerRef = useRef(null)
  const syncTimerRef = useRef(null)

  const spotifyApi = useSpotifyAuth(mode === OVERLAY_MODES.SPOTIFY)
  const { fetchLyrics: fetchYTLyrics, loading: ytLoading, error: ytError } = useYTMusicAuth()
  const player = useLyricsPlayer(Boolean(lyrics && lyrics.length > 0))
  const {
    progressMs,
    resetPlayer,
    startFromBeginning,
    syncExternalPlayback,
    setDurationMs,
  } = player

  // Compute active lyric index via O(log N) binary search so LyricsDisplay only re-renders on line changes
  const activeLyricIndex = useMemo(
    () => findActiveLyricIndex(lyrics, progressMs),
    [lyrics, progressMs]
  )

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  const loadAutoDetectedTrackLyrics = useCallback(
    async (media, trackKey) => {
      const query = `${media.title} ${media.artist || ''}`.trim()
      const res = await fetchYTLyrics(query)
      if (lastAutoTrackKeyRef.current !== trackKey) return

      if (res?.song) {
        const finalDuration =
          media.durationMs > 0
            ? media.durationMs
            : res.song.duration
            ? res.song.duration * 1000
            : DEFAULT_TRACK_DURATION_MS

        const enrichedTrack = createTrackFromYTMusic(res.song, {
          name: media.title || res.song.name,
          artist: media.artist || res.song.artist?.name,
          durationMs: finalDuration,
          source: 'auto',
        })
        const timedLyrics = normalizeLyricsWithTiming(res.lyrics, finalDuration)

        setTrack(enrichedTrack)
        setDurationMs(finalDuration)
        setIsSynced(Boolean(res.isSynced))
        setLyrics(timedLyrics || [])
      }
    },
    [fetchYTLyrics, setDurationMs]
  )

  // Manual Sync Action (Exclusive to Auto-Detect Mode)
  const handleSyncNow = useCallback(async () => {
    if (mode !== OVERLAY_MODES.AUTO) return

    setIsSyncing(true)
    try {
      const media = await fetchSystemMediaSession()
      if (!media || !media.active || !media.title) return

      const trackKey = getTrackSignature(media.title, media.artist)
      const osPlaying = media.status === 'Playing'
      const needsLyricsReload =
        trackKey !== lastAutoTrackKeyRef.current || !lyrics || lyrics.length === 0

      lastAutoTrackKeyRef.current = trackKey
      syncExternalPlayback({
        positionMs: media.positionMs || 0,
        trackDurationMs: media.durationMs > 0 ? media.durationMs : undefined,
        playing: osPlaying,
        force: true,
      })

      if (needsLyricsReload) {
        const systemTrack = createTrackFromSystemMedia(media)
        setTrack(systemTrack)
        await loadAutoDetectedTrackLyrics(media, trackKey)
      }
    } catch (err) {
      console.error('Manual sync error:', err)
    } finally {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
      syncTimerRef.current = setTimeout(() => setIsSyncing(false), 350)
    }
  }, [mode, lyrics, syncExternalPlayback, loadAutoDetectedTrackLyrics])

  // 1. Universal OS Media Auto-Detection Use Case (Non-overlapping sequential poll)
  useEffect(() => {
    if (mode !== OVERLAY_MODES.AUTO) return

    let cancelled = false
    let pollTimeoutId = null

    const pollSystemMedia = async () => {
      try {
        const media = await fetchSystemMediaSession()
        if (cancelled) return

        if (media && media.active && media.title) {
          const trackKey = getTrackSignature(media.title, media.artist)
          const osPlaying = media.status === 'Playing'

          if (trackKey !== lastAutoTrackKeyRef.current) {
            lastAutoTrackKeyRef.current = trackKey
            const systemTrack = createTrackFromSystemMedia(media)

            setTrack(systemTrack)
            setLyrics(null)
            syncExternalPlayback({
              positionMs: media.positionMs || 0,
              trackDurationMs: systemTrack.durationMs,
              playing: osPlaying,
              force: true,
            })

            await loadAutoDetectedTrackLyrics(media, trackKey)
          } else {
            syncExternalPlayback({
              positionMs: media.positionMs,
              trackDurationMs: media.durationMs,
              playing: osPlaying,
              force: false,
            })
          }
        }
      } catch (err) {
        console.error('Auto-detect media error:', err)
      } finally {
        if (!cancelled) {
          pollTimeoutId = setTimeout(pollSystemMedia, 1000)
        }
      }
    }

    pollSystemMedia()

    return () => {
      cancelled = true
      if (pollTimeoutId) {
        clearTimeout(pollTimeoutId)
      }
    }
  }, [mode, syncExternalPlayback, loadAutoDetectedTrackLyrics])

  // 2. Spotify Web API Mode Use Case
  const fetchCurrentSpotifyTrack = useCallback(async () => {
    if (mode !== OVERLAY_MODES.SPOTIFY) return

    try {
      const res = await spotifyApi.getMyCurrentPlayingTrack()
      const spotifyTrack = createTrackFromSpotify(res)
      if (spotifyTrack) {
        setTrack(spotifyTrack)
        syncExternalPlayback({
          positionMs: res.progress_ms || 0,
          trackDurationMs: spotifyTrack.durationMs,
          playing: Boolean(res.is_playing),
          force: false,
        })
      }
    } catch (err) {
      console.error('Error fetching current track:', err)
    }
  }, [mode, spotifyApi, syncExternalPlayback])

  const fetchSpotifyLyrics = useCallback(
    async (id, trackDurationMs) => {
      if (!id || mode !== OVERLAY_MODES.SPOTIFY) return

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      try {
        const { lines, audioData } = await fetchSpotifyTrackLyricsAndAudio(
          id,
          BEARER_TOKEN,
          abortControllerRef.current.signal
        )
        const normalized = normalizeLyricsWithTiming(lines, trackDurationMs)
        setLyrics(normalized)
        setIsSynced(true)
        setSongAudioData(audioData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setLyrics(null)
          console.error('Error fetching track data:', err)
        }
      }
    },
    [mode]
  )

  useEffect(() => {
    if (mode !== OVERLAY_MODES.SPOTIFY) {
      if (spotifyIntervalRef.current) {
        clearInterval(spotifyIntervalRef.current)
        spotifyIntervalRef.current = null
      }
      return
    }

    fetchCurrentSpotifyTrack()
    const intervalMs = getCallSpeed(songAudioData?.tempo)
    spotifyIntervalRef.current = setInterval(fetchCurrentSpotifyTrack, intervalMs)

    return () => {
      if (spotifyIntervalRef.current) {
        clearInterval(spotifyIntervalRef.current)
      }
    }
  }, [mode, fetchCurrentSpotifyTrack, songAudioData?.tempo])

  useEffect(() => {
    if (mode !== OVERLAY_MODES.SPOTIFY || !track?.id || track.id === lastTrackIdRef.current) return

    lastTrackIdRef.current = track.id
    fetchSpotifyLyrics(track.id, track.durationMs)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [mode, track?.id, track?.durationMs, fetchSpotifyLyrics])

  // 3. Manual YT Music Search Use Case
  const handleManualSearch = useCallback(
    async (e) => {
      e.preventDefault()
      if (!ytQuery.trim()) return

      resetPlayer()
      setTrack(null)
      setLyrics(null)
      setSongAudioData(null)

      const res = await fetchYTLyrics(ytQuery)
      if (res?.song) {
        const ytTrack = createTrackFromYTMusic(res.song)
        const timedLyrics = normalizeLyricsWithTiming(res.lyrics, ytTrack.durationMs)

        setTrack(ytTrack)
        setIsSynced(Boolean(res.isSynced))
        setLyrics(timedLyrics || [])

        if (timedLyrics && timedLyrics.length > 0) {
          startFromBeginning(ytTrack.durationMs)
        }
      }
    },
    [ytQuery, fetchYTLyrics, resetPlayer, startFromBeginning]
  )

  const handleModeChange = useCallback(
    (newMode) => {
      lastTrackIdRef.current = null
      lastAutoTrackKeyRef.current = null
      resetPlayer()
      setTrack(null)
      setLyrics(null)
      setSongAudioData(null)
      setMode(newMode)
    },
    [resetPlayer]
  )

  return {
    mode,
    handleModeChange,
    ytQuery,
    setYtQuery,
    handleManualSearch,
    handleSyncNow,
    isSyncing,
    ytLoading,
    ytError,
    track,
    lyrics,
    activeLyricIndex,
    isSynced,
    player,
  }
}
