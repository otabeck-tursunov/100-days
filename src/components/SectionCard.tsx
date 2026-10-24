import type { DayRecord, Item, Section } from '../db/types'
import { progress } from '../lib/stats'
import { ChecklistItem } from './ChecklistItem'

const META = {
  morning: { title: 'Tongi navbat', icon: '☀️', cls: 'sec-morning' },
  evening: { title: 'Kechki tekshiruv', icon: '🌙', cls: 'sec-evening' },
} as const

export function SectionCard({ section, items, date, day, isToday }: {
  section: Section
  items: Item[]
  date: string
  day: DayRecord
  isToday: boolean
}) {
  const meta = META[section]
  const list = items.filter((i) => i.section === section)
  const p = progress(items, date, day, section)

  return (
    <section className={`card ${meta.cls}`} aria-label={meta.title}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-accent">
          <span aria-hidden>{meta.icon}</span> {meta.title}
        </h2>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent" aria-label={`${p.done} / ${p.total}`}>
          {p.done}/{p.total}
        </span>
      </header>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${p.pct}%` }} />
      </div>
      <ul className="space-y-0.5">
        {list.map((item) => (
          <ChecklistItem key={item.id} item={item} date={date} day={day} isToday={isToday} />
        ))}
        {!list.length && <li className="py-3 text-sm text-muted">Bandlar yo'q. Sozlamalardan qo'shing.</li>}
      </ul>
    </section>
  )
}
