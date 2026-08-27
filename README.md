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

Plain Vite runs the **whole app — UI and the realtime backend** — with no
Netlify account or CLI. The Functions are served in-process by a dev plugin
(`scripts/vite-api-plugin.mjs`) backed by an in-memory session store, so
`create` / `join` / `answer` / `host` / `state` all work locally:

```bash
npm install
npm run dev            # http://localhost:5173
```

The dev server also binds to your LAN (`host: true`), so Vite prints a
**Network** URL (e.g. `http://192.168.1.x:5173`). Open that on phones on the
same Wi-Fi to host and join a real multi-device quiz — no deploy needed. The
in-memory store lives in the dev process, so sessions reset when you restart it.

> Same code path as production: the plugin invokes the actual
> `netlify/functions/*.mjs` handlers — only the storage backend differs
> (in-memory locally vs. Netlify Blobs in the cloud), selected by `QUIZ_STORE`.

To test against a **real Blobs sandbox** (closest to production) with the
Netlify CLI instead:

```bash
npm i -g netlify-cli
npm run dev:netlify    # http://localhost:8888
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
