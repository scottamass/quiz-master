// GET /api/state?code=ABC123
// Returns the live state everyone polls: phase, current question index, the
// player list (with scores) and the answers for the current question.
import { readSession, json } from '../shared/store.mjs'

export const config = { path: '/api/state' }

export default async (req) => {
  const url = new URL(req.url)
  const code = (url.searchParams.get('code') || '').toUpperCase()
  if (!code) return json({ error: 'missing_code' }, 400)

  const session = await readSession(code)
  if (!session) return json({ error: 'not_found' }, 404)

  const currentIndex = session.currentIndex ?? 0
  const answers = (session.answers && session.answers[currentIndex]) || {}

  return json({
    code,
    phase: session.phase,
    currentIndex,
    players: session.players || {},
    answers,
  })
}
