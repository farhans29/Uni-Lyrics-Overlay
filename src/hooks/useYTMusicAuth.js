import { useState, useCallback } from "react";

export function useYTMusicAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLyrics = useCallback(async (query) => {
    if (!query) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3001/api/lyrics?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch lyrics');
      }
      
      const data = await response.json();
      return data;
      
    } catch (err) {
      console.error('Error fetching YT Music lyrics:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchLyrics, loading, error };
}
