import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { generateSessionCode, codeToPeerId } from '../lib/sessionCode.js'
import { MSG, welcome, question, reveal, finished } from '../lib/protocol.js'
import { PEER_CONFIG, CONNECT_TIMEOUT_MS, qlog } from '../lib/peerConfig.js'
import questions from '../data/questions.json'

// Phases of the host-driven quiz.
export const PHASE = {
  LOBBY: 'lobby',
  QUESTION: 'question',
  REVEALED: 'revealed',
  FINISHED: 'finished',
}

// Host hook: this browser tab is the authoritative hub. It owns the quiz
// state and broadcasts to all connected contestants over PeerJS.
export function useHost() {
  const [sessionCode, setSessionCode] = useState(null)
  const [status, setStatus] = useState('connecting') // connecting | ready | error
  const [error, setError] = useState(null)

  const [players, setPlayers] = useState([]) // [{ id, name, score }]
  const [phase, setPhase] = useState(PHASE.LOBBY)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // { peerId: choice } for current question

  const peerRef = useRef(null)
  const connsRef = useRef(new Map()) // peerId -> DataConnection
  const playersRef = useRef(new Map()) // peerId -> { id, name, score }
  const answersRef = useRef(new Map()) // peerId -> choice (current question)
  const phaseRef = useRef(PHASE.LOBBY)
  const indexRef = useRef(0)

  const total = questions.length

  const syncPlayers = useCallback(() => {
    setPlayers([...playersRef.current.values()])
  }, [])

  const syncAnswers = useCallback(() => {
    setAnswers(Object.fromEntries(answersRef.current))
  }, [])

  const send = useCallback((peerId, message) => {
    const conn = connsRef.current.get(peerId)
    if (conn && conn.open) conn.send(message)
  }, [])

  const broadcast = useCallback((message) => {
    for (const conn of connsRef.current.values()) {
      if (conn.open) conn.send(message)
    }
  }, [])

  const handleMessage = useCallback(
    (peerId, data) => {
      if (!data || typeof data !== 'object') return
      const player = playersRef.current.get(peerId)

      if (data.type === MSG.JOIN) {
        const name = String(data.name || 'Player').slice(0, 24).trim() || 'Player'
        playersRef.current.set(peerId, { id: peerId, name, score: 0 })
        syncPlayers()
        send(peerId, welcome(peerId, playersRef.current.size))
        return
      }

      if (data.type === MSG.ANSWER) {
        // Only accept answers for the live question, and only once per player.
        if (phaseRef.current !== PHASE.QUESTION) return
        if (data.questionIndex !== indexRef.current) return
        if (!player) return
        if (answersRef.current.has(peerId)) return
        if (!['a', 'b', 'c', 'd'].includes(data.choice)) return
        answersRef.current.set(peerId, data.choice)
        syncAnswers()
      }
    },
    [send, syncPlayers, syncAnswers],
  )

  // Create the peer once on mount, retrying with a fresh code on ID collision.
  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let opened = false

    // If the signaling server never opens the peer, stop showing the spinner
    // and surface a clear error instead of hanging forever.
    const timeout = setTimeout(() => {
      if (cancelled || opened) return
      setError(
        "Couldn't reach the signaling server to create a session. A network or " +
          'firewall may be blocking WebRTC (common on corporate Wi-Fi).',
      )
      setStatus('error')
    }, CONNECT_TIMEOUT_MS)

    const create = () => {
      const code = generateSessionCode()
      qlog('host', 'creating peer', codeToPeerId(code))
      const peer = new Peer(codeToPeerId(code), PEER_CONFIG)
      peerRef.current = peer

      peer.on('open', () => {
        if (cancelled) return
        opened = true
        clearTimeout(timeout)
        qlog('host', 'peer open, session code =', code)
        setSessionCode(code)
        setStatus('ready')
      })

      peer.on('connection', (conn) => {
        qlog('host', 'incoming connection from', conn.peer)
        conn.on('open', () => {
          connsRef.current.set(conn.peer, conn)
          // If the quiz is already running, bring latecomers to the lobby only.
        })
        conn.on('data', (data) => handleMessage(conn.peer, data))
        conn.on('close', () => {
          connsRef.current.delete(conn.peer)
          playersRef.current.delete(conn.peer)
          answersRef.current.delete(conn.peer)
          syncPlayers()
          syncAnswers()
        })
        conn.on('error', () => {})
      })

      peer.on('error', (err) => {
        if (cancelled) return
        // Unavailable-ID means the random code collided; try another few times.
        if (err.type === 'unavailable-id' && attempts < 5) {
          attempts += 1
          qlog('host', 'id collision, retrying with a new code')
          peer.destroy()
          create()
          return
        }
        clearTimeout(timeout)
        qlog('host', 'error:', err.type, err.message)
        setError(err.message || String(err))
        setStatus('error')
      })
    }

    create()

    return () => {
      cancelled = true
      clearTimeout(timeout)
      if (peerRef.current) peerRef.current.destroy()
    }
  }, [handleMessage, syncPlayers, syncAnswers])

  const startQuiz = useCallback(() => {
    if (playersRef.current.size === 0) return
    indexRef.current = 0
    setCurrentIndex(0)
    answersRef.current = new Map()
    syncAnswers()
    phaseRef.current = PHASE.QUESTION
    setPhase(PHASE.QUESTION)
    broadcast(question(0, total, questions[0]))
  }, [broadcast, syncAnswers, total])

  const revealAnswer = useCallback(() => {
    if (phaseRef.current !== PHASE.QUESTION) return
    const idx = indexRef.current
    const q = questions[idx]

    // Tally distribution and award points.
    const distribution = { a: 0, b: 0, c: 0, d: 0 }
    for (const [peerId, choice] of answersRef.current) {
      if (distribution[choice] !== undefined) distribution[choice] += 1
      if (choice === q.correct) {
        const p = playersRef.current.get(peerId)
        if (p) p.score += 1
      }
    }
    syncPlayers()

    phaseRef.current = PHASE.REVEALED
    setPhase(PHASE.REVEALED)

    // Each contestant gets a personalised reveal.
    for (const [peerId, player] of playersRef.current) {
      const choice = answersRef.current.get(peerId) || null
      send(
        peerId,
        reveal(idx, q.correct, distribution, choice, player.score, choice === q.correct),
      )
    }
  }, [send, syncPlayers])

  const buildLeaderboard = useCallback(() => {
    return [...playersRef.current.values()]
      .map((p) => ({ name: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score)
  }, [])

  const nextQuestion = useCallback(() => {
    if (phaseRef.current !== PHASE.REVEALED) return
    const next = indexRef.current + 1
    if (next >= total) {
      finishQuiz()
      return
    }
    indexRef.current = next
    setCurrentIndex(next)
    answersRef.current = new Map()
    syncAnswers()
    phaseRef.current = PHASE.QUESTION
    setPhase(PHASE.QUESTION)
    broadcast(question(next, total, questions[next]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcast, syncAnswers, total])

  const finishQuiz = useCallback(() => {
    const leaderboard = buildLeaderboard()
    phaseRef.current = PHASE.FINISHED
    setPhase(PHASE.FINISHED)
    broadcast(finished(leaderboard))
  }, [broadcast, buildLeaderboard])

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
    startQuiz,
    revealAnswer,
    nextQuestion,
    finishQuiz,
  }
}
