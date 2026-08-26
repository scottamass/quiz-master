const LETTER_STYLES = {
  a: 'bg-rose-500',
  b: 'bg-sky-500',
  c: 'bg-amber-500',
  d: 'bg-emerald-500',
}

// A single answer option. Visual state depends on selection / reveal:
// - selected (before reveal): brand ring
// - correct (after reveal): green
// - chosen-but-wrong (after reveal): red
export default function AnswerButton({
  letter,
  text,
  onClick,
  disabled = false,
  selected = false,
  revealed = false,
  isCorrect = false,
  isChosen = false,
}) {
  let stateClasses = 'border-slate-700 bg-slate-800 hover:bg-slate-700'

  if (revealed) {
    if (isCorrect) {
      stateClasses = 'border-emerald-400 bg-emerald-600/90 text-white'
    } else if (isChosen) {
      stateClasses = 'border-rose-400 bg-rose-600/80 text-white'
    } else {
      stateClasses = 'border-slate-800 bg-slate-800/50 opacity-60'
    }
  } else if (selected) {
    stateClasses = 'border-brand-400 bg-brand-600/30 ring-2 ring-brand-400'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-default ${stateClasses}`}
    >
      <span
        className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl font-bold uppercase text-white ${LETTER_STYLES[letter]}`}
      >
        {letter}
      </span>
      <span className="text-lg font-medium">{text}</span>
    </button>
  )
}
