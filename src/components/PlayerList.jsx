// Host-side list of connected contestants. During a question it can show
// who has answered; otherwise it shows scores.
export default function PlayerList({ players, answers = null, showScores = false }) {
  if (players.length === 0) {
    return (
      <p className="text-slate-400">No one has joined yet. Share the code above to get started.</p>
    )
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {players.map((p) => {
        const answered = answers ? Boolean(answers[p.id]) : false
        return (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/60 px-4 py-2.5"
          >
            <span className="font-medium">{p.name}</span>
            {answers ? (
              <span
                className={`text-sm font-semibold ${
                  answered ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                {answered ? '✓ Answered' : 'Waiting…'}
              </span>
            ) : showScores ? (
              <span className="text-sm font-semibold text-brand-300">{p.score} pts</span>
            ) : (
              <span className="text-sm text-slate-500">Ready</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
