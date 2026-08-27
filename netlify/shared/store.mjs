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

// When QUIZ_STORE=memory (set by the local dev server, scripts/dev-local),
// sessions live in a plain in-process Map instead of Netlify Blobs. This lets
// the whole app — including the realtime backend — run with just `vite`, no
// Netlify account or CLI. The env is read per-call so it works regardless of
// module import order.
const memory = new Map()
const useMemory = () => process.env.QUIZ_STORE === 'memory'

// Deep clone so callers get an isolated snapshot, matching the read-modify-write
// semantics they'd get from Blobs' JSON (re)serialization.
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)))

export function sessionStore() {
  return getStore(STORE_NAME)
}

export function sessionKey(code) {
  return `session/${code}`
}

export async function readSession(code) {
  if (useMemory()) return clone(memory.get(sessionKey(code)) ?? null)
  const store = sessionStore()
  return store.get(sessionKey(code), { type: 'json' })
}

export async function writeSession(code, session) {
  session.updatedAt = Date.now()
  if (useMemory()) {
    memory.set(sessionKey(code), clone(session))
    return
  }
  const store = sessionStore()
  await store.setJSON(sessionKey(code), session)
}

export async function deleteSession(code) {
  if (useMemory()) {
    memory.delete(sessionKey(code))
    return
  }
  const store = sessionStore()
  await store.delete(sessionKey(code))
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}
