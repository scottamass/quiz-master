import { useCallback, useEffect, useRef, useState } from 'react'
import { joinSession, submitAnswer as apiSubmitAnswer, fetchState } from '../lib/api.js'
import { PHASE } from './useHost.js'
import questions from '../data/questions.json'

const POLL_MS = 1500

// Contestant hook: joins the session on the server, then polls for state and
// follows whatever phase the host has set. Questions come from the bundled
// data (same app), so only control state + answers travel over the wire.
export function useContestant(code, name) {
  const [status, setStatus] = useState('connecting') // connecting | joined | error | closed
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState(PHASE.LOBBY)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { playerId: choice } for current question
  const [players, setPlayers] = useState({}) // { playerId: { name, score } }
  const [myChoice, setMyChoice] = useState(null)

  const playerIdRef = useRef(null)
  const myChoiceRef = useRef(null)
  const prevIndexRef = useRef(0)
  const phaseRef = useRef(PHASE.LOBBY)

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

        // New question → clear our previous answer.
        if (state.currentIndex !== prevIndexRef.current) {
          prevIndexRef.current = state.currentIndex
          setMyChoice(null)
          myChoiceRef.current = null
        }

        setCurrentIndex(state.currentIndex)
        setAnswers(state.answers || {})
        setPlayers(state.players || {})
        setPhase(state.phase)
        phaseRef.current = state.phase
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

  const submitAnswer = useCallback(
    (choice) => {
      if (myChoiceRef.current) return // lock in — one answer only
      if (phaseRef.current !== PHASE.QUESTION) return
      if (!playerIdRef.current) return
      myChoiceRef.current = choice
      setMyChoice(choice)
      apiSubmitAnswer(code, playerIdRef.current, currentIndex, choice).catch(() => {
        // If the write fails, unlock so they can retry.
        myChoiceRef.current = null
        setMyChoice(null)
      })
    },
    [code, currentIndex],
  )

  // Derive the view-model the page expects.
  const q = questions[currentIndex]
  const question = q
    ? { index: currentIndex, total: questions.length, question: q.question, answers: q.answers }
    : null

  let revealData = null
  if (phase === PHASE.REVEALED && q) {
    const distribution = { a: 0, b: 0, c: 0, d: 0 }
    for (const choice of Object.values(answers)) {
      if (distribution[choice] !== undefined) distribution[choice] += 1
    }
    const me = playerIdRef.current ? players[playerIdRef.current] : null
    revealData = {
      index: currentIndex,
      correct: q.correct,
      distribution,
      yourChoice: myChoice,
      yourScore: me ? me.score : 0,
      wasCorrect: myChoice === q.correct,
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
    leaderboard,
    submitAnswer,
  }
}
