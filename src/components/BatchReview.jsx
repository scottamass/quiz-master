import QuestionCard from './QuestionCard.jsx'

// Reveals a whole batch of questions at once: each question with its correct
// answer highlighted (and, for a contestant, their own pick marked). Shared by
// the host and contestant reveal screens. No scores or distribution — standings
// are held back until the final results screen.
export default function BatchReview({ items, total }) {
  return (
    <div className="grid gap-8">
      {items.map((item) => (
        <QuestionCard
          key={item.index}
          index={item.index}
          total={total}
          question={item.question}
          answers={item.answers}
          revealed
          correct={item.correct}
          selected={item.yourChoice}
        />
      ))}
    </div>
  )
}
