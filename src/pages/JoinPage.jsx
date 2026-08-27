import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { normalizeSessionCode, isValidSessionCode } from '../lib/sessionCode.js'

export default function JoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your name.')
      return
    }
    if (!isValidSessionCode(code)) {
      setError('Enter the full 6-character session code.')
      return
    }
    // Name is passed via router state so it never appears in the URL.
    navigate(`/play/${code}`, { state: { name: trimmedName } })
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-6 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
        ← Back
      </Link>
      <h1 className="mb-1 text-3xl font-bold">Join a Quiz</h1>
      <p className="mb-6 text-slate-500 dark:text-slate-400">Enter the code your host is showing.</p>

      <form onSubmit={submit} className="card grid gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Session code</label>
          <input
            className="input text-center font-mono text-2xl uppercase tracking-[0.3em]"
            placeholder="ABC123"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => {
              setCode(normalizeSessionCode(e.target.value))
              setError(null)
            }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Your name</label>
          <input
            className="input"
            placeholder="e.g. Alex"
            value={name}
            maxLength={24}
            onChange={(e) => {
              setName(e.target.value)
              setError(null)
            }}
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button type="submit" className="btn-primary w-full text-lg">
          Join
        </button>
      </form>
    </div>
  )
}
