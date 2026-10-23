const YTMusic = require("./vendor/ytmusic-api.cjs");
const { fetchLrclibLyrics } = require("./lrclibService.cjs");

const MAX_CACHE_ENTRIES = 30;

/**
 * Application/Infrastructure Service: YouTube Music & Synced Lyrics Resolver
 * Single Responsibility: Manages YTMusic lifecycle, bounded LRU caching, request deduplication, and lyrics resolution.
 */
class YTMusicLyricsService {
  constructor() {
    this.ytmusic = new YTMusic();
    this.initPromise = null;
    this.cache = new Map();
    this.inflightRequests = new Map();
  }

  async ensureInitialized() {
    if (!this.initPromise) {
      this.initPromise = this.ytmusic
        .initialize()
        .then(() => {
          console.log("✅ YTMusic API Initialized");
          return true;
        })
        .catch((error) => {
          console.error("❌ Failed to initialize YTMusic API:", error);
          this.initPromise = null;
          throw new Error("YTMusic API is not yet initialized");
        });
    }
    return this.initPromise;
  }

  getCached(normalizedKey) {
    if (!this.cache.has(normalizedKey)) return null;
    const entry = this.cache.get(normalizedKey);
    // Refresh LRU order
    this.cache.delete(normalizedKey);
    this.cache.set(normalizedKey, entry);
    return entry;
  }

  setCached(normalizedKey, value) {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(normalizedKey, value);
  }

  async searchSongAndLyrics(query) {
    if (!query || !String(query).trim()) {
      return { error: "Query parameter is required", statusCode: 400 };
    }

    const normalizedQuery = String(query).trim().toLowerCase();
    const cachedResult = this.getCached(normalizedQuery);
    if (cachedResult) {
      return cachedResult;
    }

    // Deduplicate concurrent identical searches
    if (this.inflightRequests.has(normalizedQuery)) {
      return this.inflightRequests.get(normalizedQuery);
    }

    const requestPromise = this._executeSearch(String(query).trim(), normalizedQuery).finally(() => {
      this.inflightRequests.delete(normalizedQuery);
    });

    this.inflightRequests.set(normalizedQuery, requestPromise);
    return requestPromise;
  }

  async _executeSearch(cleanQuery, normalizedQuery) {
    await this.ensureInitialized();

    const searchResults = await this.ytmusic.searchSongs(cleanQuery);
    if (!searchResults || searchResults.length === 0) {
      return { error: "Song not found", statusCode: 404 };
    }

    const topSong = searchResults[0];
    const songId = topSong.videoId;

    const [lrcData, ytLyrics] = await Promise.all([
      fetchLrclibLyrics(topSong.name, topSong.artist?.name, topSong.duration),
      this.ytmusic.getLyrics(songId).catch(() => null),
    ]);

    let result = null;
    if (lrcData?.syncedLyrics) {
      result = {
        song: topSong,
        lyrics: lrcData.syncedLyrics,
        isSynced: true,
      };
    } else if (ytLyrics && (!Array.isArray(ytLyrics) || ytLyrics.length > 0)) {
      result = {
        song: topSong,
        lyrics: ytLyrics,
        isSynced: false,
      };
    } else if (lrcData?.plainLyrics) {
      result = {
        song: topSong,
        lyrics: lrcData.plainLyrics,
        isSynced: false,
      };
    }

    if (result) {
      this.setCached(normalizedQuery, result);
      return result;
    }

    return { error: "Lyrics not available for this track", statusCode: 404 };
  }
}

const ytMusicLyricsService = new YTMusicLyricsService();

module.exports = {
  YTMusicLyricsService,
  ytMusicLyricsService,
};
