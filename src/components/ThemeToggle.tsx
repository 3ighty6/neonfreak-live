import { useEffect, useState } from 'react'

// Default is dark (matches the app's existing look, zero markup needed).
// Adds/removes html.light and persists the choice.
const STORAGE_KEY = 'nl-theme'

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('light', theme === 'light')
}

export function initTheme() {
  const saved = (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null) || 'dark'
  applyTheme(saved)
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(STORAGE_KEY) as 'light' | 'dark' | null) || 'dark'
  )

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
    </button>
  )
}
