import express from 'express';
import cors from 'cors';
import YTMusic from 'ytmusic-api';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const ytmusic = new YTMusic();
let isInitialized = false;

// Initialize ytmusic API
async function initYTMusic() {
  try {
    await ytmusic.initialize();
    isInitialized = true;
    console.log('✅ YTMusic API Initialized');
  } catch (error) {
    console.error('❌ Failed to initialize YTMusic API:', error);
  }
}

initYTMusic();

// Endpoint to fetch lyrics
app.get('/api/lyrics', async (req, res) => {
  try {
    if (!isInitialized) {
      return res.status(503).json({ error: 'YTMusic API is not yet initialized' });
    }

    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    console.log(`🔍 Searching for song: ${query}`);
    
    // 1. Search for the song
    const searchResults = await ytmusic.searchSongs(query);
    
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const songId = searchResults[0].videoId;
    console.log(`🎵 Found song ID: ${songId} (${searchResults[0].name} by ${searchResults[0].artist.name})`);

    // 2. Fetch lyrics using the videoId
    try {
      const lyrics = await ytmusic.getLyrics(songId);
      
      // YT Music API doesn't always provide synchronized lines separated like Spotify's API does.
      // We will parse it to match the expected format for the frontend.
      // Usually ytmusic-api returns an object with a 'lyrics' or 'content' string.
      
      if (!lyrics) {
        return res.status(404).json({ error: 'No lyrics found for this song' });
      }

      // Return the search result and lyrics
      res.json({
        song: searchResults[0],
        lyrics: lyrics
      });

    } catch (lyricsError) {
      console.error('❌ Error fetching lyrics:', lyricsError);
      return res.status(404).json({ error: 'Lyrics not available for this track' });
    }

  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`🚀 YT Music Lyrics Backend listening at http://localhost:${port}`);
});
