const LRCLIB_TIMEOUT_MS = 4000;

/**
 * Infrastructure Service: LRCLIB API Client
 * Single Responsibility: Fetches time-synced (.lrc) or plain lyrics from LRCLIB with strict request timeouts.
 */
async function fetchLrclibLyrics(trackName, artistName, durationSec) {
  try {
    const params = new URLSearchParams({
      track_name: trackName || "",
      artist_name: artistName || "",
    });
    if (durationSec) {
      params.set("duration", String(Math.round(durationSec)));
    }

    const getRes = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      signal: AbortSignal.timeout(LRCLIB_TIMEOUT_MS),
    });
    if (getRes.ok) {
      const data = await getRes.json();
      if (data?.syncedLyrics || data?.plainLyrics) {
        return data;
      }
    }

    const searchParams = new URLSearchParams({
      q: `${trackName || ""} ${artistName || ""}`.trim(),
    });
    const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, {
      signal: AbortSignal.timeout(LRCLIB_TIMEOUT_MS),
    });
    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        return list.find((item) => item.syncedLyrics) || list[0];
      }
    }
  } catch (err) {
    if (err.name !== "TimeoutError" && err.name !== "AbortError") {
      console.warn("⚠️ LRCLIB lookup skipped:", err.message);
    }
  }
  return null;
}

module.exports = {
  fetchLrclibLyrics,
};
