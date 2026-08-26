import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// NOTE: We deliberately do NOT wrap the app in <React.StrictMode>.
// StrictMode double-invokes effects in dev (mount → unmount → mount), which
// creates a PeerJS peer, tears it down mid-handshake, then creates another.
// That kills the signaling WebSocket before it connects and can leave the
// host/contestant hanging. WebRTC connection setup is not idempotent, so we
// keep a single, stable mount.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
