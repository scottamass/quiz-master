import { useCallback, useEffect, useRef, useState } from 'react'
import { createSession, hostUpdate, endSession, fetchState } from '../lib/api.js'
import questions from '../data/questions.json'

// Phases of the host-driven quiz.
export const PHASE = {
  LOBBY: 'lobby',
  QUESTION: 'question',
  REVEALED: 'revealed',
  FINISHED: 'finished',
}

// How often the host polls for the player list / incoming answers.
const POLL_MS = 1500

// In batch reveal mode, answers are revealed once per this many questions
// instead of after each one. Bundled (not server-driven) so host and contestant
// agree on batch boundaries.
export const BATCH_SIZE = 10

// Host hook: creates a session on the server, then polls for players and
// answers and drives the quiz forward via the API. The host's local state is
// the source of truth for phase/index; the server just persists it.
export function useHost() {
  const [sessionCode, setSessionCode] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | ready | error
  const [error, setError] = useState(null)

  const [players, setPlayers] = useState([]) // [{ id, name, score }]
  const [phase, setPhase] = useState(PHASE.LOBBY)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { playerId: choice } for current question
  const [answersByIndex, setAnswersByIndex] = useState({}) // { index: { playerId: choice } } — whole quiz
  const [revealMode, setRevealMode] = useState('each') // 'each' | 'batch'

  const codeRef = useRef(null)
  const total = questions.length

  // Create the session once on mount.
  useEffect(() => {
    let cancelled = false
    createSession()
      .then(({ code }) => {
        if (cancelled) return
        codeRef.current = code
        setSessionCode(code)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err.status
            ? `Couldn't create a session (server said "${err.code || err.status}").`
            : "Couldn't reach the server to create a session. Check your connection.",
        )
        setStatus('error')
      })

    return () => {
      cancelled = true
      if (codeRef.current) endSession(codeRef.current)
    }
  }, [])

  // Poll for players + current-question answers while the session is live.
  useEffect(() => {
    if (!sessionCode) return
    let stopped = false

    const tick = async () => {
      try {
        const state = await fetchState(sessionCode)
        if (stopped) return
        setPlayers(
          Object.entries(state.players || {}).map(([id, p]) => ({
            id,
            name: p.name,
            score: p.score || 0,
          })),
        )
        setAnswers(state.answers || {})
        setAnswersByIndex(state.answersByIndex || {})
      } catch {
        // Transient poll failure — keep going; the next tick may succeed.
      }
    }

    tick()
    const timer = setInterval(tick, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [sessionCode])

  const startQuiz = useCallback(async () => {
    if (players.length === 0) return
    setCurrentIndex(0)
    setAnswers({})
    setPhase(PHASE.QUESTION)
    // Persist the reveal mode so contestants know how to render reveals.
    await hostUpdate(codeRef.current, {
      phase: PHASE.QUESTION,
      currentIndex: 0,
      revealMode,
      batchSize: BATCH_SIZE,
    })
  }, [players.length, revealMode])

  const revealAnswer = useCallback(async () => {
    const idx = currentIndex
    const q = questions[idx]

    // Award a point to everyone who got this question right. The host knows the
    // correct answer (it's in the bundled questions), computes new cumulative
    // scores, and sends them to the server.
    const scores = {}
    for (const p of players) {
      const choice = answers[p.id]
      scores[p.id] = p.score + (choice === q.correct ? 1 : 0)
    }
    // Reflect the new scores locally right away.
    setPlayers((prev) => prev.map((p) => ({ ...p, score: scores[p.id] ?? p.score })))
    setPhase(PHASE.REVEALED)
    await hostUpdate(codeRef.current, { phase: PHASE.REVEALED, scores })
  }, [currentIndex, players, answers])

  // Batch mode, QUESTION phase: "Next Question" simply OPENS the next question.
  // It does not grade and does not clear answers — players can still go back and
  // change any answer in the open range until the batch is revealed. At the
  // batch boundary it grades the whole batch instead (see below).
  const nextBatchQuestion = useCallback(async () => {
    const idx = currentIndex
    const isRevealPoint = (idx + 1) % BATCH_SIZE === 0 || idx === total - 1

    if (!isRevealPoint) {
      const next = idx + 1
      setCurrentIndex(next)
      setAnswers({})
      setPhase(PHASE.QUESTION)
      await hostUpdate(codeRef.current, { phase: PHASE.QUESTION, currentIndex: next })
      return
    }

    // Reveal point: grade every question in this batch from the latest answers.
    // Fetch fresh state first so a player's last-second edit isn't missed.
    const start = Math.floor(idx / BATCH_SIZE) * BATCH_SIZE
    let byIndex = answersByIndex
    try {
      const fresh = await fetchState(codeRef.current)
      byIndex = fresh.answersByIndex || byIndex
    } catch {
      // Fall back to the last polled answers if the fetch fails.
    }

    // Start from the current cumulative scores (earlier batches already added)
    // and add a point per correct answer across this batch.
    const scores = {}
    for (const p of players) scores[p.id] = p.score
    for (let i = start; i <= idx; i++) {
      const q = questions[i]
      const qa = byIndex[i] || {}
      for (const p of players) {
        if (qa[p.id] === q.correct) scores[p.id] += 1
      }
    }

    setPlayers((prev) => prev.map((p) => ({ ...p, score: scores[p.id] ?? p.score })))
    setPhase(PHASE.REVEALED)
    await hostUpdate(codeRef.current, { phase: PHASE.REVEALED, scores })
  }, [currentIndex, players, answersByIndex, total])

  const finishQuiz = useCallback(async () => {
    setPhase(PHASE.FINISHED)
    await hostUpdate(codeRef.current, { phase: PHASE.FINISHED })
  }, [])

  const nextQuestion = useCallback(async () => {
    const next = currentIndex + 1
    if (next >= total) {
      await finishQuiz()
      return
    }
    setCurrentIndex(next)
    setAnswers({})
    setPhase(PHASE.QUESTION)
    await hostUpdate(codeRef.current, { phase: PHASE.QUESTION, currentIndex: next })
  }, [currentIndex, total, finishQuiz])

  const buildLeaderboard = useCallback(() => {
    return [...players]
      .map((p) => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score)
  }, [players])

  return {
    sessionCode,
    status,
    error,
    players,
    phase,
    currentIndex,
    total,
    currentQuestion: questions[currentIndex],
    answers,
    answerCount: Object.keys(answers).length,
    leaderboard: phase === PHASE.FINISHED ? buildLeaderboard() : [],
    revealMode,
    setRevealMode,
    batchSize: BATCH_SIZE,
    batchStartIndex: Math.floor(currentIndex / BATCH_SIZE) * BATCH_SIZE,
    isRevealPoint: (currentIndex + 1) % BATCH_SIZE === 0 || currentIndex === total - 1,
    startQuiz,
    revealAnswer,
    nextQuestion,
    nextBatchQuestion,
    finishQuiz,
  }
}
