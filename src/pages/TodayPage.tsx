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
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted">{formatLong(today)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-morning/15 px-3 py-1.5 text-sm font-semibold text-morning" title="Ketma-ket kunlar">
            🔥 {current} kun ketma-ket
          </span>
          <span className="rounded-full bg-surface2 px-3 py-1.5 text-sm font-semibold">Bugun: {pct}%</span>
          {canInstall && (
            <button className="btn btn-primary" onClick={install}>⬇ Ilovani o'rnatish</button>
          )}
        </div>
      </div>
      <DayView date={today} celebrate />
    </div>
  )
}
