import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// NOTE: We deliberately do NOT wrap the app in <React.StrictMode>.
// StrictMode double-invokes effects in dev (mount → unmount → mount). Our
// mount effects create a server session (host) and join it (contestant), which
// are not idempotent — double-invoking would create a duplicate session and
// spin up two polling loops. A single, stable mount keeps that clean.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
