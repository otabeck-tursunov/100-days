import { DayView } from '../components/DayView'
import { useAppData } from '../hooks/useAppData'
import { useInstall } from '../hooks/useInstall'
import { dayNumber, progress, streaks } from '../lib/stats'
import { formatLong } from '../lib/dates'

export function TodayPage() {
  const { settings, items, days, today } = useAppData()
  const { canInstall, install } = useInstall()
  const n = dayNumber(settings.startDate, today)
  const pct = progress(items, today, days.get(today)).pct
  const { current } = streaks(items, days, settings.startDate, today, settings.streakThreshold)

  const title =
    n < 1 ? `Challenge boshlanishiga ${1 - n} kun qoldi` : n > 100 ? 'Challenge yakunlandi 🏁' : `Challenge kuni ${n} / 100`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pb-2 pt-4">
        <div>
          <p className="text-sm text-muted">{formatLong(today)}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-surface px-3.5 py-1.5" title="Ketma-ket kunlar">Seriya <b>{current}</b></span>
          <span className="rounded-full bg-surface px-3.5 py-1.5">Bugun <b>{pct}%</b></span>
          {canInstall && <button className="btn btn-primary !min-h-9" onClick={install}>O'rnatish</button>}
        </div>
      </div>
      <DayView date={today} celebrate />
    </div>
  )
}
