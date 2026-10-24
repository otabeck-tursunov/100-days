import { useMemo } from 'react'
import { BarChart } from '../components/BarChart'
import { useAppData } from '../hooks/useAppData'
import { addDays, formatLong } from '../lib/dates'
import { formatHours, formatMoney } from '../lib/format'
import { isApplicable, progress, streaks } from '../lib/stats'

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card !p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function StatsPage() {
  const { settings, items, days, today } = useAppData()

  const s = useMemo(() => {
    const start = settings.startDate
    const end = today < addDays(start, 99) ? today : addDays(start, 99)
    const dates: string[] = []
    for (let d = start; d <= end; d = addDays(d, 1)) dates.push(d)

    let pages = 0, minutes = 0, money = 0, workDays = 0
    let best = { date: '', sum: 0 }
    for (const d of dates) {
      const r = days.get(d)
      pages += r?.pages ?? 0
      minutes += r?.focusMinutes ?? 0
      const e = r?.earnings ?? 0
      money += e
      if (e > 0) workDays++
      if (e > best.sum) best = { date: d, sum: e }
    }
    const avg = dates.length ? Math.round(dates.reduce((a, d) => a + progress(items, d, days.get(d)).pct, 0) / dates.length) : 0

    const habits = items
      .map((it) => {
        const ds = dates.filter((d) => isApplicable(it, d))
        const done = ds.filter((d) => days.get(d)?.checks[it.id]).length
        return { it, pct: ds.length ? Math.round((done / ds.length) * 100) : 0, n: ds.length, done }
      })
      .filter((h) => h.n > 0)
      .sort((a, b) => a.it.section.localeCompare(b.it.section) || a.it.order - b.it.order)

    const weeks = Math.max(1, Math.ceil(dates.length / 7))
    const weekly = Array.from({ length: weeks }, (_, w) => {
      const ds = dates.slice(w * 7, w * 7 + 7)
      const pct = ds.length ? ds.reduce((a, d) => a + progress(items, d, days.get(d)).pct, 0) / ds.length : 0
      const pg = ds.reduce((a, d) => a + (days.get(d)?.pages ?? 0), 0)
      const courier = ds.reduce((a, d) => a + (days.get(d)?.earnings ?? 0), 0)
      return { label: `${w + 1}`, pct, pages: pg, courier }
    })

    return { pages, minutes, money, workDays, best, avg, habits, weekly, ...streaks(items, days, start, today, settings.streakThreshold) }
  }, [settings, items, days, today])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Statistika</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Jami o'qilgan sahifa" value={String(s.pages)} />
        <Stat label="Jami dasturlash" value={formatHours(s.minutes)} />
        <Stat label="Eng uzun streak" value={`${s.longest} kun`} sub={`Hozirgi: ${s.current} kun`} />
        <Stat label="O'rtacha bajarilish" value={`${s.avg}%`} sub={s.money ? `Kuryerlik: ${formatMoney(s.money)} so'm` : undefined} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="mb-3 font-semibold">Haftalik bajarilish (%)</h2>
          <BarChart data={s.weekly.map((w) => ({ label: w.label, value: w.pct, title: `${w.label}-hafta` }))} max={100} unit="%" />
          <p className="mt-2 text-xs text-muted">Pastda — challenge haftasi raqami.</p>
        </section>
        <section className="card">
          <h2 className="mb-3 font-semibold">Haftalik o'qilgan sahifalar</h2>
          <BarChart data={s.weekly.map((w) => ({ label: w.label, value: w.pages, title: `${w.label}-hafta` }))} color="var(--c-evening)" />
        </section>
      </div>

      <section className="card">
        <h2 className="mb-3 font-semibold">Kuryerlik daromadi</h2>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Jami" value={`${formatMoney(s.money)}`} sub="so'm" />
          <Stat label="Ishlangan kunlar" value={String(s.workDays)} />
          <Stat label="O'rtacha (ish kuniga)" value={formatMoney(s.workDays ? s.money / s.workDays : 0)} sub="so'm" />
          <Stat label="Eng yaxshi kun" value={formatMoney(s.best.sum)} sub={s.best.date ? formatLong(s.best.date) : '—'} />
        </div>
        <BarChart
          data={s.weekly.map((w) => ({ label: w.label, value: w.courier / 1000, title: `${w.label}-hafta: ${formatMoney(w.courier)} so'm` }))}
          unit="k"
          color="#10b981"
        />
        <p className="mt-2 text-xs text-muted">Haftalar bo'yicha, ming so'mda. Summa “Bugun” sahifasidagi kechki ro'yxatdan olinadi.</p>
      </section>

      <section className="card">
        <h2 className="mb-3 font-semibold">Har bir odat bo'yicha</h2>
        <ul className="space-y-2.5">
          {s.habits.map(({ it, pct, done, n }) => (
            <li key={it.id} className={it.section === 'morning' ? 'sec-morning' : 'sec-evening'}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span>
                  {it.title}
                  {it.archivedDay && <span className="text-muted"> (o'chirilgan)</span>}
                </span>
                <span className="shrink-0 font-semibold text-accent" title={`${done} / ${n} kun`}>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </li>
          ))}
          {!s.habits.length && <li className="text-sm text-muted">Challenge boshlangach ma'lumot paydo bo'ladi.</li>}
        </ul>
      </section>
    </div>
  )
}
