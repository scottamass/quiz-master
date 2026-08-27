import { BATCH_SIZE } from '../hooks/useHost.js'

// Lobby setup control: choose whether the host reveals the answer after each
// question (default) or holds answers back and reveals a whole batch at once.
export default function RevealModeToggle({ mode, onChange, disabled = false }) {
  const options = [
    { value: 'each', label: 'After each question' },
    { value: 'batch', label: `Every ${BATCH_SIZE} questions` },
  ]

  return (
    <div>
      <h2 className="mb-1 text-lg font-bold">Reveal answers</h2>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        {mode === 'batch'
          ? `Players answer ${BATCH_SIZE} questions before any answers are shown.`
          : 'The correct answer is shown after every question.'}
      </p>
      <div
        role="radiogroup"
        aria-label="When to reveal answers"
        className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/60"
      >
        {options.map((opt) => {
          const active = mode === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
