import { useTheme } from '../hooks/useTheme.js'

// Fixed light/dark switch shown on every page (App renders it once, outside the
// routes). Shows the icon for the theme you'd switch *to*.
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full
        border border-slate-300 bg-white/80 text-lg shadow-lg backdrop-blur transition
        hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400
        dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
