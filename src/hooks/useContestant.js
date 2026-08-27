import { useCallback, useEffect, useRef, useState } from 'react'
import { joinSession, submitAnswer as apiSubmitAnswer, fetchState } from '../lib/api.js'
import { PHASE } from './useHost.js'
import questions from '../data/questions.json'

const POLL_MS = 1500

// Contestant hook: joins the session on the server, then polls for state and
// follows whatever phase the host has set. Questions come from the bundled
// data (same app), so only control state + answers travel over the wire.
//
// In batch mode the host opens questions one at a time but players may look
// back at any already-opened question in the batch and change their answer
// until the host reveals. `viewIndex` is the question this player is currently
// looking at; it follows the host when a new question opens but can be moved
// back/forward within the open range.
export function useContestant(code, name) {
  const [status, setStatus] = useState('connecting') // connecting | joined | error | closed
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState(PHASE.LOBBY)
  const [currentIndex, setCurrentIndex] = useState(0) // furthest question the host has opened
  const [viewIndex, setViewIndex] = useState(0) // the question this player is looking at
  const [answers, setAnswers] = useState({}) // { playerId: choice } for current question
  const [players, setPlayers] = useState({}) // { playerId: { name, score } }
  const [myChoice, setMyChoice] = useState(null) // this player's pick for the viewed question
  const [revealMode, setRevealMode] = useState('each') // 'each' | 'batch'
  const [batchSize, setBatchSize] = useState(10)

  const playerIdRef = useRef(null)
  const myChoicesRef = useRef({}) // { index: choice } — this player's answers, whole quiz
  const prevIndexRef = useRef(0)
  const phaseRef = useRef(PHASE.LOBBY)
  const viewIndexRef = useRef(0)
  const currentIndexRef = useRef(0)
  const revealModeRef = useRef('each')

  // Join once on mount.
  useEffect(() => {
    if (!code || !name) return
    let cancelled = false

    joinSession(code, name)
      .then(({ playerId }) => {
        if (cancelled) return
        playerIdRef.current = playerId
        setStatus('joined')
      })
      .catch((err) => {
        if (cancelled) return
        if (err.code === 'not_found' || err.status === 404) {
          setError('No quiz found with that code. Double-check it with the host.')
        } else {
          setError("Couldn't reach the quiz. Check your connection and try again.")
        }
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [code, name])

  // Poll for state once joined.
  useEffect(() => {
    if (status !== 'joined') return
    let stopped = false

    const tick = async () => {
      try {
        const state = await fetchState(code)
        if (stopped) return

        // Rehydrate our own picks from the server so they survive a refresh and
        // reflect the source of truth (also lets a late joiner see what they've
        // answered so far in the batch).
        const myId = playerIdRef.current
        if (state.answersByIndex && myId) {
          for (const [i, m] of Object.entries(state.answersByIndex)) {
            if (m && m[myId] != null) myChoicesRef.current[i] = m[myId]
          }
        }

        // Host opened a new question. Follow them to it — but in batch mode
        // don't yank a player who has deliberately navigated back to review an
        // earlier question (only follow if they were already on the latest one).
        if (state.currentIndex !== prevIndexRef.current) {
          const wasAtLatest = viewIndexRef.current === prevIndexRef.current
          prevIndexRef.current = state.currentIndex
          if (state.revealMode !== 'batch' || wasAtLatest) {
            viewIndexRef.current = state.currentIndex
            setViewIndex(state.currentIndex)
          }
        }

        currentIndexRef.current = state.currentIndex
        revealModeRef.current = state.revealMode || 'each'

        setCurrentIndex(state.currentIndex)
        setAnswers(state.answers || {})
        setPlayers(state.players || {})
        setPhase(state.phase)
        phaseRef.current = state.phase
        if (state.revealMode) setRevealMode(state.revealMode)
        if (state.batchSize) setBatchSize(state.batchSize)

        // Keep the displayed selection in sync with the viewed question.
        setMyChoice(myChoicesRef.current[viewIndexRef.current] ?? null)
      } catch (err) {
        if (stopped) return
        if (err.status === 404) {
          // Session was torn down by the host.
          stopped = true
          setStatus('closed')
          setError('The host ended the session.')
        }
        // Other transient errors: keep polling.
      }
    }

    tick()
    const timer = setInterval(tick, POLL_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [status, code])

  // Submit (or, in batch mode, change) this player's answer for the question
  // they're currently viewing.
  const submitAnswer = useCallback(
    (choice) => {
      if (phaseRef.current !== PHASE.QUESTION) return
      if (!playerIdRef.current) return
      const isBatch = revealModeRef.current === 'batch'
      const target = isBatch ? viewIndexRef.current : currentIndexRef.current
      // Per-question mode keeps the one-answer-only lock; batch mode allows edits.
      if (!isBatch && myChoicesRef.current[target] != null) return
      const prev = myChoicesRef.current[target] ?? null
      if (prev === choice) return

      myChoicesRef.current[target] = choice
      setMyChoice(choice)
      apiSubmitAnswer(code, playerIdRef.current, target, choice).catch(() => {
        // Roll back to the previous pick on failure so they can retry.
        if (prev == null) delete myChoicesRef.current[target]
        else myChoicesRef.current[target] = prev
        setMyChoice(myChoicesRef.current[viewIndexRef.current] ?? null)
      })
    },
    [code],
  )

  const batchStart =
    revealMode === 'batch' ? Math.floor(currentIndex / batchSize) * batchSize : currentIndex

  // Move the player's view within the open range of the current batch.
  const navTo = (i) => {
    const clamped = Math.max(batchStart, Math.min(currentIndex, i))
    viewIndexRef.current = clamped
    setViewIndex(clamped)
    setMyChoice(myChoicesRef.current[clamped] ?? null)
  }
  const goPrev = () => navTo(viewIndex - 1)
  const goNext = () => navTo(viewIndex + 1)

  // Derive the view-model the page expects. In batch mode we show the *viewed*
  // question; in per-question mode viewIndex always equals the host's index.
  const vq = questions[viewIndex]
  const question = vq
    ? { index: viewIndex, total: questions.length, question: vq.question, answers: vq.answers }
    : null

  let revealData = null
  if (phase === PHASE.REVEALED && revealMode !== 'batch' && vq) {
    const distribution = { a: 0, b: 0, c: 0, d: 0 }
    for (const choice of Object.values(answers)) {
      if (distribution[choice] !== undefined) distribution[choice] += 1
    }
    const me = playerIdRef.current ? players[playerIdRef.current] : null
    const mine = myChoicesRef.current[currentIndex] ?? null
    revealData = {
      index: currentIndex,
      correct: vq.correct,
      distribution,
      yourChoice: mine,
      yourScore: me ? me.score : 0,
      wasCorrect: mine === vq.correct,
    }
  }

  // Batch reveal: the correct answers for every question in the current batch,
  // plus this player's own pick for each. No scores here — standings are held
  // back until the final results screen.
  let batchReview = null
  if (phase === PHASE.REVEALED && revealMode === 'batch' && vq) {
    batchReview = []
    for (let i = batchStart; i <= currentIndex; i++) {
      const bq = questions[i]
      if (!bq) continue
      batchReview.push({
        index: i,
        question: bq.question,
        answers: bq.answers,
        correct: bq.correct,
        yourChoice: myChoicesRef.current[i] ?? null,
      })
    }
  }

  const leaderboard =
    phase === PHASE.FINISHED
      ? Object.values(players)
          .map((p) => ({ name: p.name, score: p.score || 0 }))
          .sort((a, b) => b.score - a.score)
      : null

  return {
    status,
    error,
    phase,
    question,
    myChoice,
    revealData,
    revealMode,
    batchSize,
    batchReview,
    leaderboard,
    submitAnswer,
    // Batch navigation (all no-ops / inert in per-question mode).
    canChange: revealMode === 'batch',
    canPrev: revealMode === 'batch' && viewIndex > batchStart,
    canNext: revealMode === 'batch' && viewIndex < currentIndex,
    openInBatch: revealMode === 'batch' ? currentIndex - batchStart + 1 : null,
    viewPosition: viewIndex - batchStart + 1,
    goPrev,
    goNext,
  }
}
