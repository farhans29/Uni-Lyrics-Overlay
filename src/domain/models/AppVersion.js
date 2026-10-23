/**
 * Domain Model: Application Semantic Version (SemVer 2.0.0)
 * Single Responsibility: Provides single-source-of-truth version metadata starting at 1.0.0.
 */

export const APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__ ? String(__APP_VERSION__) : '1.0.0'

export const APP_VERSION_TAG = `v${APP_VERSION}`

export function parseAppSemVer(versionString = APP_VERSION) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(String(versionString).trim())
  if (!match) {
    return Object.freeze({
      raw: '1.0.0',
      tag: 'v1.0.0',
      major: 1,
      minor: 0,
      patch: 0,
      prerelease: null,
    })
  }

  return Object.freeze({
    raw: versionString,
    tag: `v${versionString}`,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] || null,
  })
}

export const CURRENT_SEMVER = parseAppSemVer(APP_VERSION)
