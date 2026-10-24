import { useState } from 'react'
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

  const toggle = () => {
    if (!checked) setAnim((n) => n + 1)
    void toggleCheck(date, item.id)
  }

  return (
    <li className="border-t border-line first:border-t-0">
      <button
        data-check
        role="checkbox"
        aria-checked={checked}
        onClick={toggle}
        onKeyDown={onArrow}
        className="flex min-h-14 w-full items-center gap-4 rounded-xl py-3 text-left"
      >
        <span
          key={anim}
          className={`grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors ${
            checked ? 'pop border-accent bg-accent text-white' : 'border-muted/50'
          }`}
        >
          {checked && (
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        <span className={`flex-1 text-[15px] leading-snug transition ${checked ? 'text-muted line-through decoration-1' : ''}`}>
          {item.title}
        </span>
      </button>
      {item.kind !== 'normal' && (
        <div className="pb-4 pl-10">
          <ItemExtra item={item} date={date} day={day} isToday={isToday} />
        </div>
      )}
    </li>
  )
}
