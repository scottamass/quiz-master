import { useState } from 'react'

// Large, readable display of the session code with a copy-to-clipboard action.
export default function SessionCode({ code }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — ignore.
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Session code
      </p>
      <div className="flex items-center gap-3">
        <span className="font-mono text-5xl font-extrabold tracking-[0.2em] text-slate-900 dark:text-white sm:text-6xl">
          {code}
        </span>
        <button
          type="button"
          onClick={copy}
          className="btn-ghost px-3 py-2 text-sm"
          title="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}
