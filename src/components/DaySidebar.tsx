import { emptyDay } from '../db/types'
import { useAppData } from '../hooks/useAppData'
import { addDays, formatLong } from '../lib/dates'
import { formatHours, formatMoney } from '../lib/format'
import { progress } from '../lib/stats'

function Ring({ pct }: { pct: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="8" className="stroke-surface2" />
        <circle
          cx="60" cy="60" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke="var(--c-morning)" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-3xl font-semibold tracking-tight">{pct}%</div>
    </div>
  )
}

/** Keng ekranlarda Bugun sahifasining o'ng tomonidagi xulosa paneli. */
export function DaySidebar({ date }: { date: string }) {
  const { items, days } = useAppData()
  const day = days.get(date) ?? emptyDay(date)
  const all = progress(items, date, day)
  const m = progress(items, date, day, 'morning')
  const e = progress(items, date, day, 'evening')

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(date, i - 6)
    return { d, pct: progress(items, d, days.get(d)).pct }
  })

  return (
    <aside className="hidden space-y-4 lg:block">
      <section className="card space-y-5">
        <Ring pct={all.pct} />
        {([['Tong', m, 'var(--c-morning)'], ['Kech', e, 'var(--c-evening)']] as const).map(([label, p, color]) => (
          <div key={label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-muted">{label}</span>
              <span className="tabular-nums">{p.done} / {p.total}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.pct}%`, background: color }} />
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <h2 className="mb-3 text-sm font-medium text-muted">Bugun raqamlarda</h2>
        <dl className="space-y-2.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">O'qilgan sahifa</dt><dd className="tabular-nums">{day.pages}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Full Stack</dt><dd className="tabular-nums">{formatHours(day.focusMinutes)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Kuryerlik</dt><dd className="tabular-nums">{day.earnings ? `${formatMoney(day.earnings)} so'm` : '—'}</dd></div>
        </dl>
      </section>

      <section className="card">
        <h2 className="mb-4 text-sm font-medium text-muted">Oxirgi 7 kun</h2>
        <div className="flex h-24 items-end gap-2">
          {week.map(({ d, pct }) => (
            <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${formatLong(d)}: ${pct}%`}>
              <div
                className="w-full rounded-md"
                style={{ height: `${Math.max(4, pct)}%`, background: pct ? 'var(--c-morning)' : 'var(--c-surface2)', opacity: pct ? 0.35 + pct / 160 : 1 }}
              />
              <span className="text-[10px] text-muted">{d.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  )
}
