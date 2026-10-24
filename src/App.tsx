import { useEffect, useState } from 'react'
import { AppDataProvider, useAppData } from './hooks/useAppData'
import { useReminders } from './hooks/useReminders'
import { useTimerWatcher } from './hooks/useTimer'
import { applyTheme } from './lib/theme'
import { TodayPage } from './pages/TodayPage'
import { MapPage } from './pages/MapPage'
import { StatsPage } from './pages/StatsPage'
import { FinancePage } from './pages/FinancePage'
import { SettingsPage } from './pages/SettingsPage'

const TABS = [
  { id: 'today', label: 'Bugun', icon: '✅', Page: TodayPage },
  { id: 'map', label: 'Xarita', icon: '🗓', Page: MapPage },
  { id: 'finance', label: 'Moliya', icon: '💰', Page: FinancePage },
  { id: 'stats', label: 'Statistika', icon: '📊', Page: StatsPage },
  { id: 'settings', label: 'Sozlamalar', icon: '⚙️', Page: SettingsPage },
] as const

type TabId = (typeof TABS)[number]['id']
const fromHash = (): TabId => (TABS.find((t) => t.id === location.hash.slice(1))?.id ?? 'today')

function Shell() {
  const { settings } = useAppData()
  const [tab, setTab] = useState<TabId>(fromHash)

  useReminders(settings)
  useTimerWatcher()

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [settings.theme])

  useEffect(() => {
    const onHash = () => setTab(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Klaviatura: 1–5 — bo'limlar orasida o'tish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(el.tagName)) return
      const t = TABS[Number(e.key) - 1]
      if (t) location.hash = t.id
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const Page = TABS.find((t) => t.id === tab)!.Page

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex items-center gap-2 font-bold">
            <img src={import.meta.env.BASE_URL + 'favicon.svg'} alt="" className="size-8" />
            Kunlik Navbat
          </div>
          <nav className="hidden gap-1 md:flex" aria-label="Asosiy">
            {TABS.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                title={`Tugma: ${i + 1}`}
                aria-current={tab === t.id ? 'page' : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${tab === t.id ? 'bg-surface2' : 'text-muted hover:bg-surface2/60'}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 md:pb-10">
        <Page />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Asosiy"
      >
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${tab === t.id ? 'text-morning' : 'text-muted'}`}
          >
            <span className="text-xl" aria-hidden>{t.icon}</span>
            {t.label}
          </a>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <AppDataProvider fallback={<div className="grid min-h-dvh place-items-center text-muted">Yuklanmoqda…</div>}>
      <Shell />
    </AppDataProvider>
  )
}
