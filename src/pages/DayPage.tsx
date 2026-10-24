import { useEffect } from 'react'
import { DayView } from '../components/DayView'
import { DaySidebar } from '../components/DaySidebar'
import { useAppData } from '../hooks/useAppData'
import { addDays, formatFull } from '../lib/dates'
import { dayNumber, progress } from '../lib/stats'

/** Xaritadagi bitta kunning alohida sahifasi: #day/YYYY-MM-DD */
export function DayPage({ date }: { date: string }) {
  const { settings, items, days, today } = useAppData()
  const n = dayNumber(settings.startDate, date)
  const pct = progress(items, date, days.get(date)).pct
  const prev = addDays(date, -1)
  const next = addDays(date, 1)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [date])

  const label = n >= 1 && n <= 100 ? `${n}-kun` : 'Challengedan tashqari kun'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pb-2 pt-4">
        <div>
          <a href="#map" className="mb-2 inline-flex items-center gap-1 text-sm text-muted transition hover:text-fg">
            ← Xarita
          </a>
          <p className="text-sm text-muted">{formatFull(date)}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {label}
            <span className="ml-3 text-xl font-normal text-muted">{pct}%</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={`#day/${prev}`} className="btn" aria-label="Oldingi kun">←</a>
          {date !== today && <a href="#today" className="btn">Bugun</a>}
          <a href={`#day/${next}`} className="btn" aria-label="Keyingi kun">→</a>
        </div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DayView key={date} date={date} />
        <DaySidebar date={date} />
      </div>
    </div>
  )
}
