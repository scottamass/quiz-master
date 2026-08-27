import { useState } from 'react'

// A ready-to-share link that opens the join page with the session code
// prefilled (players only enter their name). Built from the current origin so
// it works both locally and on the LAN dev URL.
export default function JoinLink({ code }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/join?code=${code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (e.g. insecure context) — ignore.
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <button type="button" onClick={copy} className="btn-ghost w-full text-sm">
        {copied ? 'Link copied!' : 'Copy join link'}
      </button>
      <p className="break-all text-center text-xs text-slate-500 dark:text-slate-400">{url}</p>
    </div>
  )
}
