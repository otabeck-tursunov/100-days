import { useEffect, useRef, useState } from 'react'
import { emptyDay } from '../db/types'
import { itemsFor, progress } from '../lib/stats'
import { useAppData } from '../hooks/useAppData'
import { SectionCard } from './SectionCard'
import { Confetti } from './Confetti'

type View = 'morning' | 'evening' | 'all'

/** Bugun: soat 16:00 gacha tong, keyin kech ochiladi. */
const defaultView = (isToday: boolean): View => {
  if (!isToday) return 'all'
  const h = new Date().getHours()
  return h >= 4 && h < 16 ? 'morning' : 'evening'
}

/** Bitta kunning tongi va kechki ro'yxatlari (bugun yoki o'tgan kun). */
export function DayView({ date, celebrate = false }: { date: string; celebrate?: boolean }) {
  const { items, days, today } = useAppData()
  const day = days.get(date) ?? emptyDay(date)
  const list = itemsFor(items, date)
  const pct = progress(items, date, day).pct
  const isToday = date === today
  const [view, setView] = useState<View>(() => defaultView(isToday))

  const prev = useRef<number | null>(null)
  const [party, setParty] = useState(false)
  useEffect(() => {
    if (celebrate && prev.current !== null && prev.current < 100 && pct === 100) setParty(true)
    prev.current = pct
  }, [pct, celebrate])

  const m = progress(items, date, day, 'morning')
  const e = progress(items, date, day, 'evening')
  const tabs: [View, string, string][] = [
    ['morning', `☀️ Tong ${m.done}/${m.total}`, 'sec-morning'],
    ['evening', `🌙 Kech ${e.done}/${e.total}`, 'sec-evening'],
    ['all', 'Hammasi', ''],
  ]

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Bo'lim">
          {tabs.map(([v, label, cls]) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`btn ${cls} ${view === v ? (v === 'all' ? 'bg-fg !text-bg' : 'btn-primary') : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
        {(view === 'morning' || view === 'all') && (
          <SectionCard section="morning" items={list} date={date} day={day} isToday={isToday} />
        )}
        {(view === 'evening' || view === 'all') && (
          <SectionCard section="evening" items={list} date={date} day={day} isToday={isToday} />
        )}
      </div>
      {party && <Confetti onDone={() => setParty(false)} />}
    </>
  )
}
