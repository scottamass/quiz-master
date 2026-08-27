import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'quiz-master-theme'

// Resolve the theme to apply on first paint: an explicit saved choice wins,
// otherwise fall back to the OS preference. Kept in sync with the inline script
// in index.html so there's no flash of the wrong theme on load.
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage may be unavailable (private mode) — fall through.
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'dark'
}

// Single source of truth shared by every consumer (the toggle, the chart, …).
// A plain module store + useSyncExternalStore keeps them all in sync without a
// context provider wrapping the tree.
let currentTheme = getInitialTheme()
const listeners = new Set()

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore write failures (private mode / quota).
  }
}

// Reflect the initial resolved theme immediately (the inline script covers the
// pre-React paint; this keeps the class correct if that was skipped).
applyTheme(currentTheme)

function setTheme(theme) {
  if (theme === currentTheme) return
  currentTheme = theme
  applyTheme(theme)
  listeners.forEach((l) => l())
}

export function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark')
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Manages the light/dark theme: reflects it onto <html> (the `dark` class that
// Tailwind's class strategy keys off) and persists the user's choice.
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => currentTheme, () => currentTheme)
  return { theme, toggleTheme }
}
