import type { DayRecord, Item, Section } from '../db/types'
import { addDays, diffDays } from './dates'

export const isApplicable = (item: Item, date: string) =>
  item.createdDay <= date && (!item.archivedDay || date < item.archivedDay)

export const itemsFor = (items: Item[], date: string, section?: Section) =>
  items
    .filter((i) => isApplicable(i, date) && (!section || i.section === section))
    .sort((a, b) => a.order - b.order)

export interface Progress {
  done: number
  total: number
  pct: number
}

export function progress(items: Item[], date: string, day?: DayRecord, section?: Section): Progress {
  const list = itemsFor(items, date, section)
  const done = list.filter((i) => day?.checks[i.id]).length
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export function streaks(
  items: Item[],
  days: Map<string, DayRecord>,
  start: string,
  today: string,
  threshold: number,
) {
  const ok = (d: string) => progress(items, d, days.get(d)).pct >= threshold
  let longest = 0
  let run = 0
  for (let d = start; d <= today; d = addDays(d, 1)) {
    run = ok(d) ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  let current = 0
  let d = today
  if (!ok(d)) d = addDays(d, -1) // bugun hali tugamagan bo'lishi mumkin
  while (d >= start && ok(d)) {
    current++
    d = addDays(d, -1)
  }
  return { current, longest }
}

export const dayNumber = (start: string, today: string) => diffDays(today, start) + 1
