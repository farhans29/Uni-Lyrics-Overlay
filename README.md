<p align="center">
  <img src="./public/icon.png" width="96" alt="Universal Lyrics Overlay Logo" />
</p>

<h1 align="center">Universal Lyrics Overlay</h1>
<p align="center"><strong>Real-time, time-synced desktop lyrics overlay for Spotify, YouTube Music, and Desktop Media Players.</strong></p>

> **Note:** Originally forked from [Nicolas-Arias3142/Spotify_Lyrics_Overlay](https://github.com/Nicolas-Arias3142/Spotify_Lyrics_Overlay), **Universal Lyrics Overlay** has been completely re-architected with cross-platform native media detection (Linux MPRIS, macOS AppleScript, and Windows GSMTC), time-synced LRCLIB + YouTube Music lyrics, a Spotify Core UI, and zero API setup required.

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.9-1DB954?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/electron-36-47848F?style=flat-square&logo=electron" alt="Electron 36" />
  <img src="https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20macOS%20%7C%20Windows-0078D6?style=flat-square" alt="Cross-Platform" />
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#building-installer--executable">Building Executable</a> ·
  <a href="#versioning">Versioning</a> ·
  <a href="#disclaimers">Disclaimers</a> ·
  <a href="#license">License</a>
</p>

---

## Features

- **Universal Auto-Detect Mode (Zero Config / No API Keys Needed)**
  - Automatically detects the active song, artist, playback state, and timeline position across:
    - **Linux**: MPRIS D-Bus (`org.mpris.MediaPlayer2`) with support for `playerctl` and systemd `busctl` (Spotify, VLC, Chrome, Firefox, Amberol, Cider, etc.).
    - **macOS**: Native AppleScript control for **Spotify** and **Apple Music**.
    - **Windows**: Windows Runtime `GlobalSystemMediaTransportControlsSessionManager` (GSMTC) for Spotify, Edge, Chrome, Apple Music, and desktop media players.
  - Fetches millisecond-synced lyrics from **LRCLIB** with automatic fallback to **YouTube Music** lyrics and smart proportional pacing.
- **Manual Search Mode**
  - Search for any song or artist on demand directly from **YouTube Music** without needing an active media player.
- **Bottom-Docked Spotify Core Player & Transport Controls**
  - Play / Pause, Stop & Reset (`0:00`), interactive timeline progress scrubber, and click-on-any-lyric-line to seek.
  - Dedicated **Sync** button in `Auto Detect` mode to re-lock lyrics to the live OS media timestamp at any time.
- **Lyrics-Only Mode**
  - One-click eye toggle in the top bar (or in Settings) hides both the top control bar and bottom player card so only floating lyrics remain on screen. Hover anywhere over the window to reveal the floating **Show Player** pill.
- **Customizable Visuals & Typography**
  - **Album Art Picture Background**: Display crisp album cover artwork in the middle-upper background behind the lyrics.
  - **Match Album Cover Color Glow**: Ambient blurred album-art color backdrop that adapts to every track.
  - **Font Type Selector**: Choose between `Default (Inter Tight)`, `Sans-Serif`, `Serif`, `Roboto`, `Monospace`, and fonts installed on your PC (`Segoe UI`, `Georgia`, `Arial`, `Consolas`, `Cascadia Code`, etc.).
  - **Dark & Light Themes**, **Background Transparency Slider (`0%` – `100%`)**, and **Pinned Window (Always on Top)**.

---

## Getting Started

### Prerequisites
- **Linux** (with `playerctl` or systemd `busctl`), **macOS 11+**, or **Windows 10 / 11**
- **Node.js 20+**
- **pnpm** (`corepack enable pnpm`)

### Quick Setup (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/farhans29/Uni-Lyrics-Overlay.git
   cd Uni-Lyrics-Overlay
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run in development mode**
   ```bash
   pnpm run start
   ```
   > **No `.env` file is required** for `Auto Detect` or `Manual` modes. The overlay works out of the box.

---

## Building Installer & Executable

Compile the overlay into a standalone distributable or executable:

```bash
# Build for current host platform
pnpm run dist

# Build specifically for Linux (AppImage & .deb)
pnpm run dist:linux

# Build specifically for macOS (DMG & .zip)
pnpm run dist:mac

# Build specifically for Windows (NSIS .exe installer)
pnpm run dist:win
```

Build outputs are generated in the `dist-electron/` directory:
- **Linux**: `dist-electron/Lyrics Overlay-<version>.AppImage` and `.deb`
- **macOS**: `dist-electron/Lyrics Overlay-<version>.dmg` and `.zip`
- **Windows**: `dist-electron/Lyrics Overlay Setup <version>.exe`

---

## Versioning

This project follows **Semantic Versioning (`MAJOR.MINOR.PATCH`)** managed via [`scripts/version.cjs`](./scripts/version.cjs) and tracked in [`CHANGELOG.md`](./CHANGELOG.md):

```bash
# Check current version
pnpm run version:current

# Bump patch version (e.g., 1.0.8 -> 1.0.9) and update CHANGELOG.md
node scripts/version.cjs patch "Description of changes"

# Bump version and build Windows installer in one step
pnpm run release:patch
```

---

## Disclaimers

- **Non-Affiliation**: Universal Lyrics Overlay is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Spotify AB, Google LLC (YouTube Music), or Microsoft Corporation. All product names, logos, and brands are property of their respective owners.
- **Lyrics & Artwork Ownership**: All song lyrics and album cover artwork displayed by the application remain the intellectual property of their respective songwriters, publishers, and record labels.
- **Legacy Spotify Web API Mode (Optional / Hidden by Default)**:
  - If you manually enable and use the legacy Spotify Web API mode instead of the built-in OS Auto-Detect mode, and you are prompted to log into Spotify through the program, close the program and inspect the `createWindow` comments in [`public/electron.cjs`](./public/electron.cjs).
  - In legacy Spotify Web API mode, bearer tokens expire every 30–60 minutes (`No lyrics found`), requiring a fresh token. Using the default **Auto Detect** mode avoids this limitation completely.

---

## License

Licensed under the [GNU General Public License v3.0 (GPL-3.0)](./LICENSE).
