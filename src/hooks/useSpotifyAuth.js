import { useEffect } from 'react'
import SpotifyWebApi from 'spotify-web-api-js'

const spotifyApi = new SpotifyWebApi()

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const SCOPES = 'user-read-currently-playing user-read-playback-state'

const generateRandomString = (length) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return values.reduce((acc, x) => acc + possible[x % possible.length], "")
}

const sha256 = async (plain) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return window.crypto.subtle.digest('SHA-256', data)
}

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function useSpotifyAuth(isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    const initializeAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      let code = urlParams.get('code')

      let token = localStorage.getItem('spotify_access_token')
      let expiresAt = localStorage.getItem('spotify_expires_at')

      // 1. If we just returned from Spotify Auth with a code
      if (code) {
        let codeVerifier = localStorage.getItem('code_verifier')

        try {
          const payload = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: REDIRECT_URI,
              code_verifier: codeVerifier,
            }),
          }

          const body = await fetch(TOKEN_ENDPOINT, payload)
          const response = await body.json()

          if (response.access_token) {
            token = response.access_token
            const expiresIn = response.expires_in
            expiresAt = Date.now() + expiresIn * 1000

            localStorage.setItem('spotify_access_token', token)
            localStorage.setItem('spotify_expires_at', expiresAt)
            if (response.refresh_token) {
              localStorage.setItem('spotify_refresh_token', response.refresh_token)
            }

            // Remove code from URL
            window.history.replaceState({}, document.title, window.location.pathname)

            spotifyApi.setAccessToken(token)
            return;
          } else {
            console.error("Failed to exchange token", response);
          }
        } catch (error) {
          console.error("Error exchanging code for token", error);
        }
      }

      // 2. Check if we need to refresh token or authenticate
      if (!token || Date.now() > expiresAt) {
        // If we have a refresh token, we could refresh it here. For simplicity, we trigger a new login.
        console.log('Token missing or expired, redirecting to login...')

        const codeVerifier = generateRandomString(64)
        const hashed = await sha256(codeVerifier)
        const codeChallenge = base64encode(hashed)

        window.localStorage.setItem('code_verifier', codeVerifier)

        const authUrl = new URL(AUTH_ENDPOINT)
        const params = {
          response_type: 'code',
          client_id: CLIENT_ID,
          scope: SCOPES,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
          redirect_uri: REDIRECT_URI,
        }

        authUrl.search = new URLSearchParams(params).toString()
        window.location.replace(authUrl.toString())
      } else {
        // 3. We have a valid token, set it
        spotifyApi.setAccessToken(token)
      }
    }

    initializeAuth()
  }, [isActive])

  return spotifyApi
}
