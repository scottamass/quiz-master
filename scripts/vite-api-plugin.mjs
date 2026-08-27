// Vite dev plugin: serves the Netlify Functions locally, in-process.
//
// It mounts the *actual* function handlers (netlify/functions/*.mjs) as dev
// middleware, converting Node's req/res to the web Request/Response the
// handlers expect. Backed by the in-memory store (QUIZ_STORE=memory), so the
// full realtime backend runs under plain `vite` with no Netlify CLI or account.
// Using the real handlers means local testing exercises the same code that
// runs in production.
import actionHandler from '../netlify/functions/action.mjs'
import stateHandler from '../netlify/functions/state.mjs'

const ROUTES = {
  '/api/action': actionHandler,
  '/api/state': stateHandler,
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Build the web Request the function handler expects from the Node request.
async function toWebRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const init = { method: req.method, headers: req.headers }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const body = await readBody(req)
    if (body.length) init.body = body
  }
  return new Request(url, init)
}

async function sendWebResponse(res, response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

export default function apiPlugin() {
  return {
    name: 'quiz-local-api',
    configureServer(server) {
      // Route sessions to the in-memory store instead of Netlify Blobs.
      process.env.QUIZ_STORE = process.env.QUIZ_STORE || 'memory'

      server.middlewares.use(async (req, res, next) => {
        const path = req.url.split('?')[0]
        const handler = ROUTES[path]
        if (!handler) return next()

        try {
          const request = await toWebRequest(req)
          const response = await handler(request)
          await sendWebResponse(res, response)
        } catch (err) {
          server.config.logger.error(`[local-api] ${path} failed: ${err.stack || err}`)
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'local_api_error' }))
        }
      })
    },
  }
}
