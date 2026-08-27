// Thin client for the Netlify Functions API. Everything is plain HTTPS, which
// is what lets this work on restrictive/corporate networks where WebRTC and
// even WebSockets get blocked.

async function post(action, payload = {}) {
  const res = await fetch('/api/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `request_failed_${res.status}`)
    err.code = data.error
    err.status = res.status
    throw err
  }
  return data
}

export function createSession() {
  return post('create')
}

export function joinSession(code, name) {
  return post('join', { code, name })
}

export function submitAnswer(code, playerId, questionIndex, choice) {
  return post('answer', { code, playerId, questionIndex, choice })
}

export function hostUpdate(code, update) {
  return post('host', { code, ...update })
}

export function endSession(code) {
  // Best-effort teardown; keepalive lets it fire during page unload.
  return fetch('/api/action', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'end', code }),
    keepalive: true,
  }).catch(() => {})
}

export async function fetchState(code) {
  const res = await fetch(`/api/state?code=${encodeURIComponent(code)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `state_failed_${res.status}`)
    err.code = data.error
    err.status = res.status
    throw err
  }
  return data
}
