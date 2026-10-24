import type { ThemeMode } from '../db/types'

export function applyTheme(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', mode)
  } catch {
    /* ixtiyoriy */
  }
}
