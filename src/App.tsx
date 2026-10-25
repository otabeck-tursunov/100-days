import { useEffect, useState } from 'react'
import { AppDataProvider, useAppData } from './hooks/useAppData'
import { useReminders } from './hooks/useReminders'
import { useTimerWatcher } from './hooks/useTimer'
import { applyTheme } from './lib/theme'
import { startSync } from './sync/engine'
import { TodayPage } from './pages/TodayPage'
import { MapPage } from './pages/MapPage'
import { StatsPage } from './pages/StatsPage'
import { FinancePage } from './pages/FinancePage'
import { SettingsPage } from './pages/SettingsPage'
import { DayPage } from './pages/DayPage'

const TABS = [
  { id: 'today', label: 'Bugun', Page: TodayPage },
  { id: 'map', label: 'Xarita', Page: MapPage },
  { id: 'finance', label: 'Moliya', Page: FinancePage },
  { id: 'stats', label: 'Statistika', Page: StatsPage },
  { id: 'settings', label: 'Sozlamalar', Page: SettingsPage },
] as const

type TabId = (typeof TABS)[number]['id']
const fromHash = (): TabId => (TABS.find((t) => t.id === location.hash.slice(1))?.id ?? 'today')

const dayFromHash = () => location.hash.match(/^#day\/(\d{4}-\d{2}-\d{2})$/)?.[1] ?? null

function Shell() {
  const { settings } = useAppData()
  const [tab, setTab] = useState<TabId>(fromHash)
  const [dayDate, setDayDate] = useState<string | null>(dayFromHash)

  useReminders(settings)
  useTimerWatcher()
  useEffect(() => startSync(), [])

  useEffect(() => {
    applyTheme(settings.theme)
    if (settings.theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => applyTheme('system')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [settings.theme])

  useEffect(() => {
    const onHash = () => {
      setTab(fromHash())
      setDayDate(dayFromHash())
    }
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
  const activeTab: TabId = dayDate ? 'map' : tab

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5 font-semibold tracking-tight">
            <img src={import.meta.env.BASE_URL + 'favicon.svg'} alt="" className="size-7" />
            100 kun
          </div>
          <nav className="hidden gap-1 md:flex" aria-label="Asosiy">
            {TABS.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                title={`Tugma: ${i + 1}`}
                aria-current={activeTab === t.id ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === t.id ? 'bg-surface text-fg' : 'text-muted hover:text-fg'}`}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-4 md:pb-12">
        {dayDate ? <DayPage date={dayDate} /> : <Page />}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Asosiy"
      >
        {TABS.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            aria-current={activeTab === t.id ? 'page' : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium ${activeTab === t.id ? 'text-fg' : 'text-muted'}`}
          >
            {t.label}
            <span className={`size-1 rounded-full ${activeTab === t.id ? 'bg-fg' : 'bg-transparent'}`} />
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
