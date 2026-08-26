# Quiz Master

A real-time quiz hosting web app. The host creates a session, contestants join
with a 6-character code, and the host drives the quiz. There's no backend — the
host's browser tab acts as the hub using **PeerJS** (WebRTC), so it deploys to
any static host (Netlify).

## How it works

- **Host** (`/host`) creates a session; the session code maps to a PeerJS peer ID.
- **Contestants** (`/join` → `/play/:code`) connect peer-to-peer to the host.
- The host broadcasts questions, collects answers, reveals results with a live
  distribution chart, and shows a final scoreboard. Scoring is 1 point per
  correct answer.

Trade-offs for this iteration: the host must keep their tab open, there's no
persistence, and it targets typical quiz sizes (~10–50 players). Some strict
corporate networks may block WebRTC.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

To try it end to end, open two tabs: one on `/host`, one on `/join`.

## Build & deploy

```bash
npm run build    # outputs dist/
```

Deploy `dist/` to Netlify. `netlify.toml` sets the build command and an SPA
redirect so deep links like `/play/ABC123` resolve.

## Tech stack

Vite · React 18 · Tailwind CSS 3 · PeerJS · Chart.js + react-chartjs-2 · React Router v6
