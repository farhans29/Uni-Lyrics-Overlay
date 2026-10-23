import { memo } from 'react'

/**
 * Presentational Component: Manual Track Search Bar
 * Memoized to avoid unnecessary re-renders during playback ticks.
 */
const SearchBar = memo(function SearchBar({ query, onQueryChange, onSubmit, loading }) {
  return (
    <form onSubmit={onSubmit} className="search-form">
      <input
        type="text"
        className="search-input"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search song title & artist..."
      />
      <button type="submit" className="search-btn" disabled={loading}>
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  )
})

export default SearchBar
