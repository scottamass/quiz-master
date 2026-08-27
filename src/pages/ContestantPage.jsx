import { useLocation, useParams, Link } from 'react-router-dom'
import { useContestant } from '../hooks/useContestant.js'
import { PHASE } from '../hooks/useHost.js'
import QuestionCard from '../components/QuestionCard.jsx'
import AnswerChart from '../components/AnswerChart.jsx'
import Scoreboard from '../components/Scoreboard.jsx'
import BatchReview from '../components/BatchReview.jsx'

export default function ContestantPage() {
  const { code } = useParams()
  const location = useLocation()
  const name = location.state?.name

  // If someone lands on /play/:code directly (no name in state), send them to
  // the join form to enter one.
  if (!name) {
    return (
      <Centered>
        <p className="mb-4 text-slate-700 dark:text-slate-300">You need to join with your name first.</p>
        <Link to="/join" className="btn-primary">
          Go to Join
        </Link>
      </Centered>
    )
  }

  return <Contestant code={code} name={name} />
}

function Contestant({ code, name }) {
  const c = useContestant(code, name)

  if (c.status === 'connecting') {
    return <Centered>Connecting to quiz {code}…</Centered>
  }

  if (c.status === 'error' || c.status === 'closed') {
    return (
      <Centered>
        <p className="mb-4 text-rose-400">{c.error || 'Disconnected.'}</p>
        <Link to="/join" className="btn-ghost">
          Try again
        </Link>
      </Centered>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Playing as <span className="font-semibold text-slate-900 dark:text-slate-200">{name}</span>
        </span>
        <span className="font-mono text-sm tracking-widest text-slate-500 dark:text-slate-500">{code}</span>
      </header>

      {c.phase === PHASE.LOBBY && (
        <div className="card flex flex-col items-center gap-4 py-12 text-center">
          <span className="text-4xl">⏳</span>
          <h1 className="text-2xl font-bold">You're in!</h1>
          <p className="text-slate-500 dark:text-slate-400">Waiting for the host to start the quiz…</p>
        </div>
      )}

      {c.phase === PHASE.QUESTION && c.question && c.canChange && (
        <div className="card">
          <QuestionCard
            index={c.question.index}
            total={c.question.total}
            question={c.question.question}
            answers={c.question.answers}
            interactive
            selected={c.myChoice}
            onAnswer={c.submitAnswer}
          />
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-sm"
              onClick={c.goPrev}
              disabled={!c.canPrev}
            >
              ← Prev
            </button>
            <span className="text-center text-xs text-slate-500 dark:text-slate-400">
              {c.myChoice ? 'Answer saved — tap another to change it' : 'Tap an answer'}
              <br />
              {c.openInBatch} of {c.batchSize} questions open
            </span>
            <button
              type="button"
              className="btn-ghost px-4 py-2 text-sm"
              onClick={c.goNext}
              disabled={!c.canNext}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {c.phase === PHASE.QUESTION && c.question && !c.canChange && (
        <div className="card">
          <QuestionCard
            index={c.question.index}
            total={c.question.total}
            question={c.question.question}
            answers={c.question.answers}
            interactive
            selected={c.myChoice}
            disabled={Boolean(c.myChoice)}
            onAnswer={c.submitAnswer}
          />
          <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
            {c.myChoice
              ? 'Answer locked in! Waiting for the host to reveal…'
              : 'Tap your answer to lock it in.'}
          </p>
        </div>
      )}

      {c.phase === PHASE.REVEALED && c.batchReview && (
        <div className="grid gap-6">
          <div className="card text-center">
            <h1 className="text-2xl font-extrabold">Here are the answers</h1>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              How you did on the last {c.batchReview.length}{' '}
              {c.batchReview.length === 1 ? 'question' : 'questions'}.
            </p>
          </div>
          <div className="card">
            <BatchReview items={c.batchReview} total={c.question?.total} />
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Waiting for the next question…
          </p>
        </div>
      )}

      {c.phase === PHASE.REVEALED && c.revealData && c.question && (
        <div className="grid gap-6">
          <div
            className={`card text-center ${
              c.revealData.wasCorrect ? 'border-emerald-500' : 'border-rose-500'
            }`}
          >
            <h1 className="text-2xl font-extrabold">
              {c.revealData.wasCorrect ? '✅ Correct!' : c.myChoice ? '❌ Not quite' : '⏱ No answer'}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Your score: <span className="font-bold text-brand-200">{c.revealData.yourScore} pts</span>
            </p>
          </div>
          <div className="card">
            <QuestionCard
              index={c.question.index}
              total={c.question.total}
              question={c.question.question}
              answers={c.question.answers}
              revealed
              selected={c.myChoice}
              correct={c.revealData.correct}
            />
          </div>
          <div className="card">
            <h2 className="mb-4 text-lg font-bold">How everyone answered</h2>
            <AnswerChart
              distribution={c.revealData.distribution}
              answers={c.question.answers}
              correct={c.revealData.correct}
            />
          </div>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">Waiting for the next question…</p>
        </div>
      )}

      {c.phase === PHASE.FINISHED && (
        <div className="grid gap-6">
          <div className="card text-center">
            <h1 className="mb-2 text-3xl font-extrabold">🏆 Final Scores</h1>
            <p className="text-slate-500 dark:text-slate-400">Thanks for playing!</p>
          </div>
          <div className="card">
            <Scoreboard leaderboard={c.leaderboard} highlightName={name} />
          </div>
          <Link to="/" className="btn-ghost w-full text-center">
            Back home
          </Link>
        </div>
      )}
    </div>
  )
}

function Centered({ children }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      {children}
    </div>
  )
}
