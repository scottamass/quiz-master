import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import apiPlugin from './scripts/vite-api-plugin.mjs'

export default defineConfig({
  // apiPlugin serves the Netlify Functions in-process during `vite` dev, so the
  // realtime backend works locally without the Netlify CLI. It's a no-op for
  // `vite build`.
  plugins: [react(), apiPlugin()],
  server: {
    // Bind to 0.0.0.0 so other devices on the LAN (phones joining the quiz) can
    // reach the dev server. Vite prints the Network URL to share.
    host: true,
  },
})
