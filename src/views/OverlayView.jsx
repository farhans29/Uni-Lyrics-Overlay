import { OVERLAY_MODES } from '../domain/models/OverlaySettings'
import { formatTime } from '../util/helperFunctions'
import ControlBar from '../components/ControlBar'
import SearchBar from '../components/SearchBar'
import TitleDisplay from '../components/TitleDisplay'
import { LyricsDisplay } from '../components/LyricsDisplay'
import Settings from '../components/Settings'
import { EyeIcon } from '../components/icons/OverlayIcons'

/**
 * Presentational View: OverlayView
 * Single Responsibility: Composes all overlay UI sections from purely declarative props.
 * Layout: Top Control Bar -> Center Synced Lyrics Viewport -> Bottom Docked Player Card.
 */
function OverlayView({ controller, settings }) {
  const {
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
    player,
  } = controller

  const {
    theme,
    setTheme,
    fontFamily,
    setFontFamily,
    availableFonts,
    transparency,
    setTransparency,
    pinned,
    setPinned,
    lyricsOnly,
    setLyricsOnly,
    toggleLyricsOnly,
    albumArtBg,
    setAlbumArtBg,
    albumArtPic,
    setAlbumArtPic,
    isSettingsOpen,
    openSettings,
    closeSettings,
    saveSettings,
  } = settings

  const decodedCoverUrl = track?.imageUrl ? decodeURIComponent(track.imageUrl) : ''
  const showAlbumBackdrop = Boolean(albumArtBg && decodedCoverUrl)
  const showAlbumPicture = Boolean(albumArtPic && decodedCoverUrl)

  return (
    <>
      {showAlbumBackdrop && (
        <div
          className="album-bg-backdrop"
          style={{ backgroundImage: `url("${decodedCoverUrl}")` }}
          aria-hidden="true"
        />
      )}

      {showAlbumPicture && (
        <div
          className={`album-pic-backdrop ${lyricsOnly ? 'lyrics-only-pos' : ''}`}
          aria-hidden="true"
        >
          <img
            src={decodedCoverUrl}
            alt=""
            className="album-pic-backdrop-img"
          />
        </div>
      )}

      <div
        className={`divContainer ${theme === 'light' ? 'light-theme' : ''} ${
          lyricsOnly ? 'lyrics-only-active' : ''
        }`}
      >
        {isSettingsOpen && (
          <Settings
            theme={theme}
            setTheme={setTheme}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
            availableFonts={availableFonts}
            transparency={transparency}
            setTransparency={setTransparency}
            pinned={pinned}
            setPinned={setPinned}
            lyricsOnly={lyricsOnly}
            setLyricsOnly={setLyricsOnly}
            albumArtBg={albumArtBg}
            setAlbumArtBg={setAlbumArtBg}
            albumArtPic={albumArtPic}
            setAlbumArtPic={setAlbumArtPic}
            onSave={saveSettings}
            onClose={closeSettings}
          />
        )}

        {lyricsOnly ? (
          <button
            type="button"
            className="lyrics-only-restore-btn"
            onClick={toggleLyricsOnly}
            title="Show Top Bar & Player"
            aria-label="Show Top Bar and Player"
          >
            <EyeIcon />
            <span>Show Player</span>
          </button>
        ) : (
          <>
            <ControlBar
              mode={mode}
              onModeChange={handleModeChange}
              onToggleLyricsOnly={toggleLyricsOnly}
              onOpenSettings={openSettings}
            />

            {mode === OVERLAY_MODES.YTMUSIC && (
              <SearchBar
                query={ytQuery}
                onQueryChange={setYtQuery}
                onSubmit={handleManualSearch}
                loading={ytLoading}
              />
            )}

            {ytError && <p style={{ color: '#ff4444' }}>{ytError}</p>}
          </>
        )}

        <div
          style={{
            WebkitAppRegion: 'no-drag',
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="hide-scroll"
        >
          <LyricsDisplay
            activeLyricIndex={activeLyricIndex}
            lyrics={lyrics}
            mode={mode}
            loading={ytLoading}
            onSeekLine={player.seek}
          />
        </div>

        {!lyricsOnly && (
          <>
            {(track || lyrics) && <hr className="section-separator" />}

            <TitleDisplay
              name={track?.name}
              artist={track?.artist}
              imageUrl={track?.imageUrl}
              progressMs={player.progressMs}
              durationMs={player.durationMs}
              isPlaying={player.isPlaying}
              showSyncButton={mode === OVERLAY_MODES.AUTO}
              isLiveSyncLocked={!player.isManualOverride}
              isSyncing={isSyncing}
              onPlayPause={player.togglePlayPause}
              onStop={player.stop}
              onSync={handleSyncNow}
              onSeek={player.seek}
              formatTime={formatTime}
            />
          </>
        )}
      </div>
    </>
  )
}

export default OverlayView
