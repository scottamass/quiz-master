import { PHASE } from '../hooks/useHost.js'

// The host's action bar. Which buttons appear depends on the current phase.
export default function HostControls({
  phase,
  playerCount,
  currentIndex,
  total,
  onStart,
  onReveal,
  onNext,
  onFinish,
}) {
  const isLast = currentIndex >= total - 1

  if (phase === PHASE.LOBBY) {
    return (
      <button className="btn-primary w-full text-lg" onClick={onStart} disabled={playerCount === 0}>
        {playerCount === 0 ? 'Waiting for players…' : `Start Quiz (${playerCount} in)`}
      </button>
    )
  }

  if (phase === PHASE.QUESTION) {
    return (
      <button className="btn-primary w-full text-lg" onClick={onReveal}>
        Reveal Answer
      </button>
    )
  }

  if (phase === PHASE.REVEALED) {
    return (
      <div className="flex gap-3">
        {isLast ? (
          <button className="btn-primary w-full text-lg" onClick={onFinish}>
            Finish & Show Scores
          </button>
        ) : (
          <button className="btn-primary w-full text-lg" onClick={onNext}>
            Next Question
          </button>
        )}
      </div>
    )
  }

  return null
}
