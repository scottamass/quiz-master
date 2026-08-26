import AnswerButton from './AnswerButton.jsx'

const LETTERS = ['a', 'b', 'c', 'd']

// Renders a question with its four options. Used on both host and contestant
// sides — `interactive` enables answering, `revealed` shows correct/chosen.
export default function QuestionCard({
  index,
  total,
  question,
  answers,
  interactive = false,
  selected = null,
  revealed = false,
  correct = null,
  onAnswer,
  disabled = false,
}) {
  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-300">
        Question {index + 1} of {total}
      </p>
      <h2 className="mb-6 text-2xl font-bold leading-tight sm:text-3xl">{question}</h2>
      <div className="grid gap-3">
        {LETTERS.map((letter) => (
          <AnswerButton
            key={letter}
            letter={letter}
            text={answers[letter]}
            onClick={interactive ? () => onAnswer?.(letter) : undefined}
            disabled={disabled || !interactive}
            selected={selected === letter}
            revealed={revealed}
            isCorrect={revealed && correct === letter}
            isChosen={revealed && selected === letter}
          />
        ))}
      </div>
    </div>
  )
}
