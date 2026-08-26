# Quiz Master

A real-time quiz hosting web app. The host creates a session, contestants join
with a 6-character code, and the host drives the quiz. State lives in **Netlify
Functions + Netlify Blobs**, and clients **poll over plain HTTPS** — so it works
even on restrictive corporate networks that block WebRTC and WebSockets.

## How it works

- **Host** (`/host`) calls the API to create a session and gets a code.
- **Contestants** (`/join` → `/play/:code`) join the session by code.
- The host advances the quiz (start → reveal → next → finish). Everyone polls
  `GET /api/state?code=…` every ~1.5s for the current phase, players, and
  answers. Mutations go through `POST /api/action`.
- Scoring is 1 point per correct answer; the host tallies and writes scores.
- Questions are bundled in the app (`src/data/questions.json`) — only control
  state and answers travel over the wire.

There's no persistent database and no third-party account: Netlify Blobs is the
store, built into Netlify. Sessions are torn down when the host leaves.

### API (Netlify Functions)

| Route | Purpose |
|-------|---------|
| `GET /api/state?code=XYZ` | Poll current session state |
| `POST /api/action` | `create` / `join` / `answer` / `host` / `end` |

Functions live in `netlify/functions/`; shared helpers in `netlify/shared/`.

## Develop

Plain Vite (UI only, no functions):

```bash
npm install
npm run dev            # http://localhost:5173
```

Full stack locally (UI **and** functions **and** a local Blobs sandbox) needs
the Netlify CLI:

```bash
npm i -g netlify-cli
npm run dev:netlify    # http://localhost:8888  (use this to exercise the API)
```

## Build & deploy

```bash
npm run build          # builds the frontend to dist/
```

Deploy to Netlify — it reads `netlify.toml` (build command, `dist` publish dir,
functions directory, and the SPA redirect). The Functions and Blobs work
automatically on Netlify with no extra configuration.

Easiest: connect the GitHub repo in the Netlify UI (**Add new site → Import an
existing project**), or drag `dist/` — but note drag-and-drop does **not**
deploy the Functions, so use the Git/CLI flow for the full app.

## Tech stack

Vite · React 18 · Tailwind CSS 3 · Netlify Functions · Netlify Blobs ·
Chart.js + react-chartjs-2 · React Router v6
