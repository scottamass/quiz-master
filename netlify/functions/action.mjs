// POST /api/action
// All mutations go through here, routed on the `action` field:
//   { action: 'create' }                                  -> host creates a session
//   { action: 'join',   code, name }                      -> contestant joins
//   { action: 'answer', code, playerId, questionIndex, choice }
//   { action: 'host',   code, phase, currentIndex?, scores? }  -> host advances state
//   { action: 'end',    code }                             -> host tears the session down
import { readSession, writeSession, deleteSession, json } from '../shared/store.mjs'
import { generateCode } from '../shared/code.mjs'

export const config = { path: '/api/action' }

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_json' }, 400)
  }

  const action = body.action
  if (action === 'create') return createSession()

  const code = (body.code || '').toUpperCase()
  if (!code) return json({ error: 'missing_code' }, 400)

  switch (action) {
    case 'join':
      return joinSession(code, body)
    case 'answer':
      return submitAnswer(code, body)
    case 'host':
      return hostUpdate(code, body)
    case 'end':
      await deleteSession(code)
      return json({ ok: true })
    default:
      return json({ error: 'unknown_action' }, 400)
  }
}

async function createSession() {
  // Try a few codes to avoid the (astronomically unlikely) collision.
  let code
  for (let i = 0; i < 5; i++) {
    code = generateCode()
    const existing = await readSession(code)
    if (!existing) break
  }
  const session = {
    code,
    phase: 'lobby',
    currentIndex: 0,
    players: {},
    answers: {},
    createdAt: Date.now(),
  }
  await writeSession(code, session)
  return json({ code })
}

async function joinSession(code, body) {
  const session = await readSession(code)
  if (!session) return json({ error: 'not_found' }, 404)

  const name = String(body.name || 'Player').slice(0, 24).trim() || 'Player'
  const playerId = crypto.randomUUID()
  session.players = session.players || {}
  session.players[playerId] = { name, score: 0 }
  await writeSession(code, session)

  return json({ playerId, phase: session.phase })
}

async function submitAnswer(code, body) {
  const session = await readSession(code)
  if (!session) return json({ error: 'not_found' }, 404)

  const { playerId, questionIndex, choice } = body
  // Only accept an answer for the live question, from a known player, once.
  if (session.phase !== 'question') return json({ error: 'not_accepting' }, 409)
  if (questionIndex !== session.currentIndex) return json({ error: 'stale_question' }, 409)
  if (!session.players || !session.players[playerId]) return json({ error: 'unknown_player' }, 403)
  if (!['a', 'b', 'c', 'd'].includes(choice)) return json({ error: 'bad_choice' }, 400)

  session.answers = session.answers || {}
  session.answers[questionIndex] = session.answers[questionIndex] || {}
  if (session.answers[questionIndex][playerId]) {
    return json({ ok: true, locked: true }) // already answered — ignore
  }
  session.answers[questionIndex][playerId] = choice
  await writeSession(code, session)

  return json({ ok: true })
}

async function hostUpdate(code, body) {
  const session = await readSession(code)
  if (!session) return json({ error: 'not_found' }, 404)

  if (typeof body.phase === 'string') session.phase = body.phase
  if (Number.isInteger(body.currentIndex)) session.currentIndex = body.currentIndex

  // Scores are computed by the host (it knows the correct answers) and merged
  // in here. The host is the only writer of scores, so there is no race.
  if (body.scores && typeof body.scores === 'object') {
    session.players = session.players || {}
    for (const [pid, score] of Object.entries(body.scores)) {
      if (session.players[pid]) session.players[pid].score = score
    }
  }

  await writeSession(code, session)
  return json({ ok: true })
}
