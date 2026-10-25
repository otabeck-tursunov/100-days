import type { DayRecord, Item, Section } from '../db/types'
import { progress } from '../lib/stats'
import { ChecklistItem } from './ChecklistItem'
import { DayExpenses } from './DayExpenses'

const META = {
  morning: { title: 'Tongi navbat', cls: 'sec-morning' },
  evening: { title: 'Kechki tekshiruv', cls: 'sec-evening' },
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
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{meta.title}</h2>
        <span className="text-sm tabular-nums text-muted">{p.done} / {p.total}</span>
      </header>
      <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface2">
        <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${p.pct}%` }} />
      </div>
      <ul>
        {list.map((item) => (
          <ChecklistItem key={item.id} item={item} date={date} day={day} isToday={isToday} />
        ))}
        {!list.length && <li className="py-3 text-sm text-muted">Bandlar yo'q. Sozlamalardan qo'shing.</li>}
      </ul>
      {section === 'evening' && <DayExpenses date={date} />}
    </section>
  )
}
