// Shared helpers for the quiz session store, backed by Netlify Blobs.
//
// The entire state for a session lives in ONE blob keyed by the session code.
// Keeping it in a single object means a state poll is a single read, which is
// what makes polling cheap. The trade-off is that concurrent writes (many
// people joining or answering in the exact same instant) are read-modify-write
// and could in theory clobber each other. At typical quiz scale (~10-50 people
// answering over several seconds) this is very unlikely and, at worst, drops a
// single answer — acceptable for iteration 1. If it ever matters, this is the
// one place to swap in a store with atomic updates (e.g. Redis).
import { getStore } from '@netlify/blobs'

const STORE_NAME = 'quiz-sessions'

export function sessionStore() {
  return getStore(STORE_NAME)
}

export function sessionKey(code) {
  return `session/${code}`
}

export async function readSession(code) {
  const store = sessionStore()
  return store.get(sessionKey(code), { type: 'json' })
}

export async function writeSession(code, session) {
  const store = sessionStore()
  session.updatedAt = Date.now()
  await store.setJSON(sessionKey(code), session)
}

export async function deleteSession(code) {
  const store = sessionStore()
  await store.delete(sessionKey(code))
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
