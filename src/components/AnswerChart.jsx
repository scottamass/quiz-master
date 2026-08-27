import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js'
import { useTheme } from '../hooks/useTheme.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const LETTERS = ['a', 'b', 'c', 'd']

// Bar chart of the answer distribution. The correct answer's bar is green;
// the rest are slate. Counts come from the host's tally.
export default function AnswerChart({ distribution, answers, correct }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const labels = LETTERS.map((l) => `${l.toUpperCase()}. ${answers[l]}`)
  const counts = LETTERS.map((l) => distribution?.[l] ?? 0)
  const colors = LETTERS.map((l) =>
    l === correct ? 'rgba(16, 185, 129, 0.9)' : 'rgba(100, 116, 139, 0.7)',
  )

  const tickColor = isDark ? '#e2e8f0' : '#334155'
  const axisTickColor = isDark ? '#94a3b8' : '#64748b'
  const gridColor = isDark ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.15)'

  const data = {
    labels,
    datasets: [
      {
        label: 'Answers',
        data: counts,
        backgroundColor: colors,
        borderRadius: 8,
      },
    ],
  }

  const maxCount = Math.max(1, ...counts)

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        beginAtZero: true,
        max: maxCount,
        ticks: { stepSize: 1, precision: 0, color: axisTickColor },
        grid: { color: gridColor },
      },
      y: {
        ticks: { color: tickColor, font: { size: 13 } },
        grid: { display: false },
      },
    },
  }

  return (
    <div className="h-56 w-full">
      <Bar data={data} options={options} />
    </div>
  )
}
