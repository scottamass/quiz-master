import { PHASE } from '../hooks/useHost.js'

// The host's action bar. Which buttons appear depends on the current phase.
export default function HostControls({
  phase,
  playerCount,
  currentIndex,
  total,
  revealMode = 'each',
  isRevealPoint = false,
  onStart,
  onReveal,
  onNextBatch,
  onNext,
  onFinish,
}) {
  const isLast = currentIndex >= total - 1
  const isBatch = revealMode === 'batch'

  if (phase === PHASE.LOBBY) {
    return (
      <button className="btn-primary w-full text-lg" onClick={onStart} disabled={playerCount === 0}>
        {playerCount === 0 ? 'Waiting for players…' : `Start Quiz (${playerCount} in)`}
      </button>
    )
  }

  if (phase === PHASE.QUESTION) {
    // Batch mode grades silently and only reveals at a batch boundary.
    if (isBatch) {
      return (
        <button className="btn-primary w-full text-lg" onClick={onNextBatch}>
          {isRevealPoint ? 'Reveal Answers' : 'Next Question'}
        </button>
      )
    }
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
            {isBatch ? 'Continue' : 'Next Question'}
          </button>
        )}
      </div>
    )
  }

  return null
}
