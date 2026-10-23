import { useOverlayController } from './hooks/useOverlayController'
import { useOverlaySettings } from './hooks/useOverlaySettings'
import OverlayView from './views/OverlayView'

/**
 * Application Composition Root: App
 * Connects Application Use-Case Controllers (Hooks) with the Presentational View.
 */
function App() {
  const controller = useOverlayController()
  const settings = useOverlaySettings(controller.mode)

  return <OverlayView controller={controller} settings={settings} />
}

export default App
