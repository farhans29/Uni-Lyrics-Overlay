<p align="center">
  <img src="./src/assets/icon.png" width="100" alt="Lyrics Overlay logo" />
</p>

<h1 align="center">Universal Lyrics Overlay (Premium Edition)</h1>
<p align="center"><strong>Live-synced Universal (Spotify & YT Music) lyrics overlay for desktop.</strong></p>

> **Note:** This is a revamped fork of the original project by [Nicolas-Arias3142](https://github.com/Nicolas-Arias3142/Spotify_Lyrics_Overlay). This version introduces a brand new sleek UI and Universal (Spotify & YT Music) support!

<p align="center">
  <img src="https://img.shields.io/badge/status-beta-yellow" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
  <img src="https://img.shields.io/badge/electron-%5E28.0.0-blue" />
  <img src="https://img.shields.io/badge/react-%5E18.0.0-blue" />
</p>

<p align="center">
  <a href="#features">Features</a> · 
  <a href="#installation">Installation</a> · 
  <a href="#building-executable">Building Executable</a> · 
  <a href="#disclaimers">Disclaimers</a>
</p>

## Features
- **Spotify Auto Mode**: Automatically detects and syncs lyrics to your currently playing Spotify track.
- **YouTube Music Mode**: Manually search for any song and artist to pull synced lyrics straight from YT Music.
- **Premium Audio Player Aesthetic**:
  - Beautiful frosted glass Control Bar and Settings Modal.
  - Fluid, high-contrast typography powered by *Inter Tight*.
  - Smoothly scaling and glowing active lyric sentences.
- **Customizable Overlay**: Use the settings gear to change the theme (Dark/Light) and adjust background glass transparency.

---

## Installation

This project uses **Vite**, **Electron**, and **pnpm**.

### 🧩 Step-by-Step Setup

1.  **Clone the repository**  
    ```bash
    git clone https://github.com/Nicolas-Arias3142/Spotify_Lyrics_Overlay.git
    cd Spotify_Lyrics_Overlay
    ```
2.  **Install dependencies**  
    *(We use `pnpm` for this project)*
    ```bash
    pnpm install
    ```
3.  **Build the project**
    ```bash
    pnpm run build
    ```
4.  **Set up your `.env` file**

    You need to configure your Spotify credentials for the Auto Mode:
    - Create a [Spotify Developer account](https://developer.spotify.com)
    - Create a new project in the Spotify Developer Dashboard
    - Copy `.env.example` and rename it to `.env`
    - In the `.env` file, set the following values:

    ```bash
    VITE_BEARER_TOKEN=fresh bearer token
    VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
    VITE_SPOTIFY_REDIRECT_URI=http://localhost:{your redirect port}
    VITE_PORT={same port as redirect url}
    ```

    **_How to get bearer token_**
    - Open your browser and tap F12 for *Developer Tools*.
    - Navigate to the *Network* tab and filter by `Fetch/XHR`.
    - Log into [Spotify Web Player](https://open.spotify.com/) and play a song with lyrics.
    - Look for the request to `https://spclient.wg.spotify.com/color-lyrics/v2`.
    - In the `Request Headers`, find `Authorization: Bearer <token>`. Copy the token and paste it into `VITE_BEARER_TOKEN`.

5.  **Start the app (Development)**
    ```bash
    pnpm run start
    ```
    Once running, the app will launch in Electron.

---

## YouTube Music Mode (No Auth Required)

You can use the **YouTube Music Mode** without setting up any Spotify credentials or `.env` file!

- Simply switch to YT Music mode in the app
- Search for any song and artist manually
- Lyrics will be fetched directly from YouTube Music

This makes it perfect for users who only want lyrics from YouTube Music and don't want to deal with Spotify authentication.

---

## Building Executable

You can compile this overlay into a standalone Windows `.exe` file!

1. Make sure `electron-builder` is installed as a devDependency.
2. Run the build command:
   ```bash
   pnpm run build
   ```
3. Run the dist command:
   ```bash
   pnpm run dist
   ```
4. Your compiled executable will appear in the `dist-electron` folder!

---

## Disclaimers

If you run and you have to log into spotify through the program, close the program and go to `public/electron.cjs` read the comments in the `createWindow` function.

After every 30min - 1hr it will say **_*No lyrics found*_** that means you need a fresh bearer token and restart program. Auto-grabbing the token is planned for future updates by the original author.

## License

This application is licensed under the [MIT license](https://github.com/Nicolas-Arias3142/Spotify_Lyrics_Overlay/blob/main/LICENSE).
