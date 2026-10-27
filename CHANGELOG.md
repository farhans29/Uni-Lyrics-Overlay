# Changelog

All notable changes to **Universal Lyrics Overlay** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.13] - 2026-10-27

### Changed
- Fix macOS media detection browser loop, handle stopped track states, and add stderr logging

## [1.0.12] - 2026-10-27

### Changed
- Add macOS AppleScript media detection, hardened runtime entitlements, and menu bar tray optimization

## [1.0.11] - 2026-10-27

### Changed
- Relicense project under GNU General Public License v3.0 (GPL-3.0)

## [1.0.10] - 2026-10-27

### Changed
- Add cross-platform Linux (MPRIS) and macOS (AppleScript) media detection and multi-OS packaging support

## [1.0.9] - 2026-10-23

### Changed
- Updated README documentation with clearer setup/feature guide and disclaimers, and revamped LICENSE.

## [1.0.8] - 2026-10-23

### Changed
- Added Font Type selector in Settings supporting Serif, Sans-Serif, Roboto, Monospace, and installed PC fonts.

## [1.0.7] - 2026-10-23

### Changed
- Added Album Art Picture Background option in Settings to display crisp album cover artwork in the middle-upper background.

## [1.0.6] - 2026-10-23

### Changed
- Removed redundant SYNCED badge from the player card since the Sync button already shows sync status.

## [1.0.5] - 2026-10-23

### Changed
- Moved Now Playing player card and transport controls to the bottom of the overlay.

## [1.0.4] - 2026-10-23

### Changed
- Added optional Match Album Cover Background ambient backdrop setting (disabled by default).

## [1.0.3] - 2026-10-23

### Changed
- Fixed Settings modal theme consistency and transparency slider track visibility across Dark and Light themes.

## [1.0.2] - 2026-10-23

### Changed
- Added Lyrics-Only Mode option to hide the top bar and player card and show only synced lyrics.

## [1.0.1] - 2026-10-23

### Changed
- Added automatic SemVer patch increment system and version display in Settings & System Tray.

## [1.0.0] - 2026-10-23

### Added
- **Universal OS Media Auto-Detection (`Auto Detect` Mode)**: Automatically detects active songs and live timestamps from Windows System Media Transport Controls (Chrome, YouTube Music, Spotify Desktop, Edge, etc.) with zero API keys required.
- **Exclusive Auto-Detect `Sync` Control**: Instant re-sync button to lock the lyrics timeline to the active OS media session.
- **Spotify Core Design Player & Transport Controls**: Circular Play/Pause button, Stop/Reset button, interactive filled progress bar, and click-to-seek on any lyric line.
- **Time-Synced Lyrics Engine**: Parallel LRCLIB `.lrc` millisecond timestamp lookup with automatic fallback pacing for unsynced tracks.
- **SOLID Clean Architecture**: Full separation into `domain/models`, `services`, `hooks`, `views`, and `components`.
- **Standard SemVer Versioning System**: Single-source-of-truth version `1.0.0` across Electron, Vite, UI, and installer artifacts.

### Changed
- Migrated YouTube Music lyrics lookup from a separate Express server process into native Electron IPC with a self-contained `ytmusic-api` vendor bundle, bounded LRU caching, and request deduplication.
- Optimized React rendering with `O(log N)` binary search lyric matching, `React.memo`, event delegation, and WinRT COM garbage collection.
