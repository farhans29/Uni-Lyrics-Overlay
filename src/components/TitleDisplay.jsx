function TitleDisplay({ name, artist, imageUrl, progress_ms, formatTime, hideTimer }) {
  if (!name && !artist && !imageUrl) {
    return null;
  }

  return (
    <>
      <div className="song-info">
        {imageUrl && <img src={decodeURIComponent(imageUrl)} alt="Album Cover" className="album-cover" />}
        <div className="song-details">
          <h2 className="song-title">{name}</h2>
          <p className="song-artist">{artist}</p>
        </div>
      </div>
      {!hideTimer && <p className="song-progress">{formatTime(progress_ms)}</p>}
    </>
  )
}

export default TitleDisplay
