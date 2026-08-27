import { Link } from 'react-router-dom'
import { useHost, PHASE } from '../hooks/useHost.js'
import questions from '../data/questions.json'
import SessionCode from '../components/SessionCode.jsx'
import PlayerList from '../components/PlayerList.jsx'
import QuestionCard from '../components/QuestionCard.jsx'
import AnswerChart from '../components/AnswerChart.jsx'
import HostControls from '../components/HostControls.jsx'
import Scoreboard from '../components/Scoreboard.jsx'
import BatchReview from '../components/BatchReview.jsx'
import RevealModeToggle from '../components/RevealModeToggle.jsx'

export default function HostPage() {
  const host = useHost()

  if (host.status === 'connecting') {
    return <Centered>Setting up your session…</Centered>
  }

  if (host.status === 'error') {
    return (
      <Centered>
        <p className="mb-4 text-rose-400">Could not create a session.</p>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{host.error}</p>
        <Link to="/" className="btn-ghost">
          Back home
        </Link>
      </Centered>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
          ← Quiz Master
        </Link>
        <span className="text-sm text-slate-500 dark:text-slate-500">
          {host.players.length} {host.players.length === 1 ? 'player' : 'players'}
        </span>
      </header>

      {host.phase === PHASE.LOBBY && (
        <div className="grid gap-6">
          <div className="card flex flex-col items-center gap-6 py-8">
            <SessionCode code={host.sessionCode} />
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Players join at <span className="font-semibold text-slate-900 dark:text-slate-200">this site → Join a Quiz</span>{' '}
              and enter the code.
            </p>
          </div>
          <div className="card">
            <h2 className="mb-4 text-lg font-bold">Lobby</h2>
            <PlayerList players={host.players} />
          </div>
          <div className="card">
            <RevealModeToggle mode={host.revealMode} onChange={host.setRevealMode} />
          </div>
          <HostControls
            phase={host.phase}
            playerCount={host.players.length}
            currentIndex={host.currentIndex}
            total={host.total}
            onStart={host.startQuiz}
          />
        </div>
      )}

      {host.phase === PHASE.QUESTION && (
        <div className="grid gap-6">
          <div className="card">
            <QuestionCard
              index={host.currentIndex}
              total={host.total}
              question={host.currentQuestion.question}
              answers={host.currentQuestion.answers}
            />
          </div>
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Answers in</h2>
              <span className="font-semibold text-brand-300">
                {host.answerCount} / {host.players.length}
              </span>
            </div>
            <PlayerList players={host.players} answers={host.answers} />
          </div>
          <HostControls
            phase={host.phase}
            playerCount={host.players.length}
            currentIndex={host.currentIndex}
            total={host.total}
            revealMode={host.revealMode}
            isRevealPoint={host.isRevealPoint}
            onReveal={host.revealAnswer}
            onNextBatch={host.nextBatchQuestion}
          />
        </div>
      )}

      {host.phase === PHASE.REVEALED && host.revealMode === 'batch' && (
        <div className="grid gap-6">
          <div className="card">
            <h2 className="mb-4 text-lg font-bold">Answers</h2>
            <BatchReview items={hostBatchItems(host)} total={host.total} />
          </div>
          <HostControls
            phase={host.phase}
            playerCount={host.players.length}
            currentIndex={host.currentIndex}
            total={host.total}
            revealMode={host.revealMode}
            onNext={host.nextQuestion}
            onFinish={host.finishQuiz}
          />
        </div>
      )}

      {host.phase === PHASE.REVEALED && host.revealMode !== 'batch' && (
        <div className="grid gap-6">
          <div className="card">
            <QuestionCard
              index={host.currentIndex}
              total={host.total}
              question={host.currentQuestion.question}
              answers={host.currentQuestion.answers}
              revealed
              correct={host.currentQuestion.correct}
            />
          </div>
          <div className="card">
            <h2 className="mb-4 text-lg font-bold">Answer distribution</h2>
            <AnswerChart
              distribution={countDistribution(host.answers)}
              answers={host.currentQuestion.answers}
              correct={host.currentQuestion.correct}
            />
          </div>
          <div className="card">
            <h2 className="mb-4 text-lg font-bold">Scores</h2>
            <PlayerList players={[...host.players].sort((a, b) => b.score - a.score)} showScores />
          </div>
          <HostControls
            phase={host.phase}
            playerCount={host.players.length}
            currentIndex={host.currentIndex}
            total={host.total}
            onNext={host.nextQuestion}
            onFinish={host.finishQuiz}
          />
        </div>
      )}

      {host.phase === PHASE.FINISHED && (
        <div className="grid gap-6">
          <div className="card text-center">
            <h1 className="mb-2 text-3xl font-extrabold">🏆 Final Scores</h1>
            <p className="text-slate-500 dark:text-slate-400">Thanks for playing!</p>
          </div>
          <div className="card">
            <Scoreboard leaderboard={host.leaderboard} />
          </div>
          <Link to="/" className="btn-ghost w-full text-center">
            Back home
          </Link>
        </div>
      )}
    </div>
  )
}

// The questions in the batch just revealed (host view — no per-player choice).
function hostBatchItems(host) {
  const items = []
  for (let i = host.batchStartIndex; i <= host.currentIndex; i++) {
    const q = questions[i]
    if (!q) continue
    items.push({ index: i, question: q.question, answers: q.answers, correct: q.correct, yourChoice: null })
  }
  return items
}

// Turn the { peerId: choice } map into { a, b, c, d } counts for the chart.
function countDistribution(answers) {
  const dist = { a: 0, b: 0, c: 0, d: 0 }
  for (const choice of Object.values(answers)) {
    if (dist[choice] !== undefined) dist[choice] += 1
  }
  return dist
}

function Centered({ children }) {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      {children}
    </div>
  )
}
