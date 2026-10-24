import { useRef, useState } from 'react'
import { toggleCheck } from '../db/actions'
import type { DayRecord, Item } from '../db/types'
import { ItemExtra } from './widgets/Widgets'

interface Props {
  item: Item
  date: string
  day: DayRecord
  isToday: boolean
}

/** ↑/↓ bilan ro'yxat ichida yurish */
function onArrow(e: React.KeyboardEvent<HTMLButtonElement>) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const all = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-check]'))
  const next = all[all.indexOf(e.currentTarget) + (e.key === 'ArrowDown' ? 1 : -1)]
  if (next) {
    e.preventDefault()
    next.focus()
  }
}

export function ChecklistItem({ item, date, day, isToday }: Props) {
  const checked = !!day.checks[item.id]
  const [anim, setAnim] = useState(0)
  const boxRef = useRef<HTMLSpanElement>(null)

  const toggle = () => {
    if (!checked) setAnim((n) => n + 1)
    void toggleCheck(date, item.id)
  }

  return (
    <li className="rounded-xl transition hover:bg-accent-soft/60">
      <button
        data-check
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        onKeyDown={onArrow}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left"
      >
        <span
          ref={boxRef}
          key={anim}
          className={`grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors ${
            checked ? 'pop border-accent bg-accent text-white' : 'border-line bg-bg'
          }`}
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        <span className={`flex-1 text-[15px] leading-snug transition ${checked ? 'text-muted line-through decoration-1' : ''}`}>
          {item.title}
        </span>
      </button>
      {item.kind !== 'normal' && (
        <div className="pb-2 pl-12 pr-2">
          <ItemExtra item={item} date={date} day={day} isToday={isToday} />
        </div>
      )}
    </li>
  )
}
