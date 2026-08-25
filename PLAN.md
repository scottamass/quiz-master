# Quiz Master — Iteration 1 Plan

## Context

Build a real-time quiz hosting web app deployed on Netlify. The host creates a session, contestants join via a code, and the host controls the quiz flow (display questions, reveal answers, advance). Contestants answer on their own devices and see results after reveal. This is iteration 1 — keep it simple, no backend, no accounts.

## Key Architecture Decision: PeerJS for Real-Time Communication

Since Netlify is static hosting (no server), the host's browser acts as the server using **PeerJS** (WebRTC DataChannels). The session code maps directly to a PeerJS peer ID — contestants connect peer-to-peer via PeerJS Cloud's free signaling server. No database, no serverless functions, no third-party accounts needed.

**Trade-offs accepted for iteration 1:**
- Host must keep their tab open (if they close it, session ends)
- No persistence — state lives in browser memory only
- Works for ~10-50 contestants (typical quiz size); not designed for hundreds
- Some strict corporate networks may block WebRTC

## Tech Stack

| Layer | Choice |
|-------|--------|
| Build | Vite |
| UI | React 18 |
| Styling | Tailwind CSS 3 |
| Real-time | PeerJS |
| Charts | Chart.js + react-chartjs-2 |
| Routing | React Router v6 |
| Hosting | Netlify (static) |

## Data Model

**Questions (static JSON in app):**
```json
[
  {
    "id": 1,
    "question": "What is the capital of France?",
    "correct": "a",
    "answers": { "a": "Paris", "b": "London", "c": "Berlin", "d": "Madrid" }
  }
]
```

## File Structure

```
quiz-master/
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  netlify.toml
  index.html
  src/
    main.jsx
    App.jsx
    index.css

    data/
      questions.json              # 10-15 sample questions

    lib/
      protocol.js                 # Message types + builders (JOIN, QUESTION, ANSWER, REVEAL, etc.)
      sessionCode.js              # Generate/validate 6-char alphanumeric codes

    hooks/
      useHost.js                  # PeerJS host logic — connection mgmt, state, message dispatch
      useContestant.js            # PeerJS contestant logic — connect, receive, answer

    pages/
      HomePage.jsx                # "Host a Quiz" / "Join a Quiz"
      HostPage.jsx                # Host dashboard (lobby → question → revealed → finished)
      JoinPage.jsx                # Enter session code + name
      ContestantPage.jsx          # Contestant view (lobby → question → revealed → finished)

    components/
      QuestionCard.jsx            # Question text + answer options
      AnswerButton.jsx            # Single A/B/C/D button with states
      AnswerChart.jsx             # Bar chart of answer distribution
      PlayerList.jsx              # Connected contestants list (host view)
      SessionCode.jsx             # Large session code display
      HostControls.jsx            # Start / Reveal / Next / Finish buttons
      Scoreboard.jsx              # Final scores sorted list
```

## Communication Protocol

Host is the hub. All messages are JSON with a `type` field.

**Host → Contestant:**
- `WELCOME` — after contestant joins
- `QUESTION` — question text + answers (no correct answer sent)
- `REVEAL` — correct answer, distribution, contestant's score
- `FINISHED` — final leaderboard

**Contestant → Host:**
- `JOIN` — name
- `ANSWER` — questionIndex + chosen letter

Session code (e.g. `ABC123`) maps to PeerJS peer ID `qm-ABC123`.

## Screen Flow

**Routes:** `/` → HomePage, `/host` → HostPage, `/join` → JoinPage, `/play/:code` → ContestantPage

### Host Flow
1. **Lobby**: See session code, list of joined contestants, "Start Quiz" button
2. **Question**: See question + answers, live count of answers received, per-contestant answer status
3. **Revealed**: Correct answer highlighted, bar chart of distribution, each contestant's answer shown, "Next Question" button
4. **Finished**: Final scoreboard

### Contestant Flow
1. **Lobby**: "Waiting for host to start..."
2. **Question**: See question + 4 answer buttons, tap to lock in
3. **Revealed**: Correct answer highlighted (green), own answer shown (green/red), bar chart, score
4. **Finished**: Final scoreboard

## Implementation Order

### Step 1: Project scaffolding
- `npm create vite@latest . -- --template react`
- Install deps: tailwindcss, postcss, autoprefixer, peerjs, chart.js, react-chartjs-2, react-router-dom
- Configure Tailwind, set up React Router, create netlify.toml
- Verify: dev server runs, build produces `dist/`

### Step 2: Static pages + sample data
- Build HomePage, JoinPage, HostPage, ContestantPage (with placeholder content per phase)
- Create `questions.json` with 10-15 sample questions
- Build reusable components: QuestionCard, AnswerButton, AnswerChart, PlayerList, Scoreboard

### Step 3: PeerJS communication layer
- Implement `sessionCode.js` and `protocol.js`
- Implement `useHost.js` — peer creation, connection handling, state management, message broadcast
- Implement `useContestant.js` — peer connection, message handling, answer submission
- Verify: two browser tabs can connect and exchange messages

### Step 4: Wire up the full quiz flow
- Lobby → Question → Revealed → Finished on both host and contestant sides
- Host controls (start, reveal, next, finish) trigger state transitions + broadcasts
- Contestant answer submission + lock-in
- Bar chart with Chart.js showing answer distribution, correct answer in green
- Scoring: 1 point per correct answer
- Final scoreboard

### Step 5: Polish + deploy
- Error handling (connection failures, invalid codes, host disconnect)
- Loading states
- Responsive design (contestants will be on phones)
- Deploy to Netlify

## Verification

1. `npm run dev` — open two tabs, one as host, one as contestant
2. Host creates session → code displayed
3. Contestant joins with code + name → appears in host's player list
4. Host starts quiz → question appears on both screens
5. Contestant answers → host sees answer tally
6. Host reveals → both see correct answer + bar chart + score
7. Host advances through all questions → finish screen with scoreboard
8. `npm run build` → deploy `dist/` to Netlify → test on separate devices (phone + laptop)
