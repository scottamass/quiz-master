const MEDALS = ['🥇', '🥈', '🥉']

// Final leaderboard, sorted by score (already sorted by the host). Optionally
// highlights the current contestant's own row.
export default function Scoreboard({ leaderboard, highlightName = null }) {
  if (!leaderboard || leaderboard.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">No scores to show.</p>
  }

  return (
    <ol className="grid gap-2">
      {leaderboard.map((entry, i) => {
        const isMe = highlightName && entry.name === highlightName
        return (
          <li
            key={`${entry.name}-${i}`}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              isMe
                ? 'border-brand-400 bg-brand-500/10 dark:bg-brand-600/20'
                : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="w-7 text-center text-lg">{MEDALS[i] || `${i + 1}.`}</span>
              <span className="font-semibold">
                {entry.name}
                {isMe && <span className="ml-2 text-xs text-brand-300">(you)</span>}
              </span>
            </span>
            <span className="font-bold text-brand-200">{entry.score} pts</span>
          </li>
        )
      })}
    </ol>
  )
}
