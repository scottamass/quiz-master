import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-10">
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">
            Quiz Master
          </span>
        </h1>
        <p className="text-lg text-slate-400">
          Host a live quiz. Players join from their phones with a code.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link to="/host" className="card group flex flex-col items-center gap-3 transition hover:border-brand-500">
          <span className="text-4xl">🎤</span>
          <span className="text-xl font-bold">Host a Quiz</span>
          <span className="text-sm text-slate-400">
            Create a session and run the quiz from this device.
          </span>
          <span className="btn-primary mt-2 w-full">Start hosting</span>
        </Link>

        <Link to="/join" className="card group flex flex-col items-center gap-3 transition hover:border-brand-500">
          <span className="text-4xl">📱</span>
          <span className="text-xl font-bold">Join a Quiz</span>
          <span className="text-sm text-slate-400">
            Enter the code your host gives you and play along.
          </span>
          <span className="btn-ghost mt-2 w-full">Enter a code</span>
        </Link>
      </div>

      <p className="mt-10 max-w-md text-xs text-slate-500">
        No accounts, no sign-up. The host keeps this tab open for the whole quiz — everything runs
        peer-to-peer in the browser.
      </p>
    </div>
  )
}
