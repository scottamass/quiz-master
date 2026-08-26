import { useCallback, useEffect, useRef, useState } from 'react'
import Peer from 'peerjs'
import { codeToPeerId } from '../lib/sessionCode.js'
import { MSG, join, answer as answerMsg } from '../lib/protocol.js'
import { PHASE } from './useHost.js'
import { PEER_CONFIG, CONNECT_TIMEOUT_MS, qlog } from '../lib/peerConfig.js'

// Contestant hook: connects to the host peer identified by the session code,
// then follows whatever phase the host broadcasts.
export function useContestant(code, name) {
  const [status, setStatus] = useState('connecting') // connecting | joined | error | closed
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState(PHASE.LOBBY)
  const [question, setQuestion] = useState(null) // { index, total, question, answers }
  const [myChoice, setMyChoice] = useState(null)
  const [revealData, setRevealData] = useState(null) // REVEAL payload
  const [leaderboard, setLeaderboard] = useState(null)

  const peerRef = useRef(null)
  const connRef = useRef(null)
  const myChoiceRef = useRef(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!code || !name) return
    let cancelled = false
    joinedRef.current = false

    const fail = (message) => {
      if (cancelled || joinedRef.current) return
      qlog('contestant', 'error:', message)
      setError(message)
      setStatus('error')
    }

    // If we never make it all the way to a WELCOME, stop spinning and explain.
    const timeout = setTimeout(() => {
      fail(
        "Couldn't reach the quiz. This is usually a network/firewall blocking " +
          'WebRTC (common on corporate or guest Wi-Fi). Try a different network, ' +
          'or check the browser console for details.',
      )
    }, CONNECT_TIMEOUT_MS)

    qlog('contestant', 'creating peer, target host =', codeToPeerId(code))
    const peer = new Peer(undefined, PEER_CONFIG)
    peerRef.current = peer

    peer.on('open', (id) => {
      if (cancelled) return
      qlog('contestant', 'peer open, my id =', id, '→ connecting to host')
      const conn = peer.connect(codeToPeerId(code), { reliable: true })
      connRef.current = conn

      conn.on('open', () => {
        if (cancelled) return
        qlog('contestant', 'data channel open → sending JOIN')
        conn.send(join(name))
      })

      conn.on('data', (data) => {
        if (!data || typeof data !== 'object' || cancelled) return
        qlog('contestant', 'recv', data.type)
        switch (data.type) {
          case MSG.WELCOME:
            joinedRef.current = true
            clearTimeout(timeout)
            setStatus('joined')
            setPhase(PHASE.LOBBY)
            break
          case MSG.QUESTION:
            setQuestion(data)
            setMyChoice(null)
            myChoiceRef.current = null
            setRevealData(null)
            setPhase(PHASE.QUESTION)
            break
          case MSG.REVEAL:
            setRevealData(data)
            setPhase(PHASE.REVEALED)
            break
          case MSG.FINISHED:
            setLeaderboard(data.leaderboard || [])
            setPhase(PHASE.FINISHED)
            break
          default:
            break
        }
      })

      conn.on('close', () => {
        if (cancelled) return
        clearTimeout(timeout)
        setStatus('closed')
        setError('The host ended the session or lost connection.')
      })

      conn.on('error', (err) => {
        clearTimeout(timeout)
        fail('Connection error: ' + (err?.message || 'could not reach the host.'))
      })
    })

    peer.on('error', (err) => {
      clearTimeout(timeout)
      if (err.type === 'peer-unavailable') {
        fail('No quiz found with that code. Double-check it with the host.')
      } else if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
        fail("Can't reach the signaling server — a network/firewall may be blocking it.")
      } else {
        fail(err.message || String(err))
      }
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      if (peerRef.current) peerRef.current.destroy()
    }
  }, [code, name])

  const submitAnswer = useCallback(
    (choice) => {
      if (myChoiceRef.current) return // lock in — one answer only
      if (!connRef.current || !connRef.current.open) return
      if (!question) return
      myChoiceRef.current = choice
      setMyChoice(choice)
      connRef.current.send(answerMsg(question.index, choice))
    },
    [question],
  )

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
