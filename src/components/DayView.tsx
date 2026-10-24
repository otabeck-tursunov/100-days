import { useEffect, useRef, useState } from 'react'
import { emptyDay, type Section } from '../db/types'
import { itemsFor, progress } from '../lib/stats'
import { useAppData } from '../hooks/useAppData'
import { SectionCard } from './SectionCard'
import { Confetti } from './Confetti'

/** Bugun: soat 16:00 gacha tong, keyin kech ochiladi. */
const defaultView = (isToday: boolean): Section => {
  if (!isToday) return 'morning'
  const h = new Date().getHours()
  return h >= 4 && h < 16 ? 'morning' : 'evening'
}

const TABS: [Section, string][] = [
  ['morning', 'Tong'],
  ['evening', 'Kech'],
]

/** Bitta kunning tongi yoki kechki ro'yxati (bugun yoki o'tgan kun). */
export function DayView({ date, celebrate = false }: { date: string; celebrate?: boolean }) {
  const { items, days, today } = useAppData()
  const day = days.get(date) ?? emptyDay(date)
  const list = itemsFor(items, date)
  const pct = progress(items, date, day).pct
  const isToday = date === today
  const [view, setView] = useState<Section>(() => defaultView(isToday))

  const prev = useRef<number | null>(null)
  const [party, setParty] = useState(false)
  useEffect(() => {
    if (celebrate && prev.current !== null && prev.current < 100 && pct === 100) setParty(true)
    prev.current = pct
  }, [pct, celebrate])

  return (
    <>
      <div className="w-full space-y-5">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-surface2 p-1" role="tablist" aria-label="Bo'lim">
          {TABS.map(([v, label]) => {
            const p = progress(items, date, day, v)
            return (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition ${
                  view === v ? `bg-surface shadow-sm ${v === 'morning' ? 'text-morning' : 'text-evening'}` : 'text-muted'
                }`}
              >
                {label}
                <span className="text-xs opacity-70">{p.done}/{p.total}</span>
              </button>
            )
          })}
        </div>
        <SectionCard key={view} section={view} items={list} date={date} day={day} isToday={isToday} />
      </div>
      {party && <Confetti onDone={() => setParty(false)} />}
    </>
  )
}
