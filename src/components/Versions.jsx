import { memo } from 'react'
import { APP_VERSION_TAG } from '../domain/models/AppVersion'

/**
 * Presentational Component: Standard Application Version Badge
 * Displays SemVer release tag (e.g. v1.0.0) and optional Electron runtime metadata.
 */
const Versions = memo(function Versions() {
  const runtimeVersions = window.electronAPI?.versions

  return (
    <div className="version-info" aria-label={`Application version ${APP_VERSION_TAG}`}>
      <span className="version-badge">{APP_VERSION_TAG}</span>
      {runtimeVersions?.electron && (
        <span className="version-runtime">Electron v{runtimeVersions.electron}</span>
      )}
    </div>
  )
})

export default Versions
