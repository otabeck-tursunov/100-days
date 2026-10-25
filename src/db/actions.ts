import { db } from './db'
import { emptyDay, type DayRecord, type Item, type Section, type Settings, type TimerState } from './types'
import { isApplicable } from '../lib/stats'
import { stampDay } from './dayStamp'

export async function patchDay(date: string, fn: (d: DayRecord) => void) {
  await db.transaction('rw', db.days, async () => {
    const old = await db.days.get(date)
    const d = old ? structuredClone(old) : emptyDay(date)
    fn(d)
    stampDay(old, d)
    await db.days.put(d)
  })
}

export const toggleCheck = (date: string, itemId: string) =>
  patchDay(date, (d) => {
    d.checks = { ...d.checks, [itemId]: !d.checks[itemId] }
  })

export const updateSettings = (patch: Partial<Settings>) => db.settings.update('main', patch)

/* ---- ro'yxat bandlari ---- */

export async function addItem(section: Section, title: string, today: string) {
  const list = await db.items.where('section').equals(section).toArray()
  const order = list.reduce((m, i) => Math.max(m, i.order), -1) + 1
  await db.items.add({
    id: crypto.randomUUID(),
    section,
    title: title.trim(),
    order,
    kind: 'normal',
    createdDay: today,
    archivedDay: null,
  })
}

export const renameItem = (id: string, title: string) => db.items.update(id, { title })

/** Band o'chirilmaydi, arxivlanadi: o'tgan kunlar tarixi buzilmaydi. */
export const removeItem = (id: string, today: string) => db.items.update(id, { archivedDay: today })

export async function moveItem(items: Item[], id: string, dir: -1 | 1) {
  const idx = items.findIndex((i) => i.id === id)
  const other = items[idx + dir]
  if (!other) return
  const me = items[idx]
  await db.transaction('rw', db.items, async () => {
    await db.items.update(me.id, { order: other.order })
    await db.items.update(other.id, { order: me.order })
  })
}

/* ---- fokus taymer ---- */

export const elapsedMs = (t: TimerState, now = Date.now()) =>
  t.accumulatedMs + (t.status === 'running' && t.startedAt ? now - t.startedAt : 0)

export async function startTimer(date: string, targetMs: number) {
  await db.transaction('rw', db.timer, async () => {
    const t = await db.timer.get('focus')
    if (t?.status === 'running') return
    if (t?.status === 'paused') {
      await db.timer.put({ ...t, status: 'running', startedAt: Date.now() })
    } else {
      await db.timer.put({ id: 'focus', status: 'running', date, targetMs, accumulatedMs: 0, startedAt: Date.now() })
    }
  })
}

export async function pauseTimer() {
  await db.transaction('rw', db.timer, async () => {
    const t = await db.timer.get('focus')
    if (t?.status !== 'running') return
    await db.timer.put({ ...t, status: 'paused', accumulatedMs: elapsedMs(t), startedAt: null })
  })
}

export const resetTimer = () =>
  db.timer.put({ id: 'focus', status: 'idle', date: '', targetMs: 0, accumulatedMs: 0, startedAt: null })

/** Taymerni yakunlaydi: daqiqalarni saqlaydi, `complete` bo'lsa bandni belgilaydi. */
export async function finishTimer(complete: boolean) {
  await db.transaction('rw', db.timer, db.days, db.items, async () => {
    const t = await db.timer.get('focus')
    if (!t || t.status === 'idle') return
    const ms = complete ? t.targetMs : Math.min(elapsedMs(t), t.targetMs)
    const minutes = Math.round(ms / 60000)
    const focusItem = complete
      ? (await db.items.toArray()).find((i) => i.kind === 'focus' && isApplicable(i, t.date))
      : undefined
    const old = await db.days.get(t.date)
    const d = old ? structuredClone(old) : emptyDay(t.date)
    d.focusMinutes += minutes
    if (focusItem) d.checks = { ...d.checks, [focusItem.id]: true }
    stampDay(old, d)
    await db.days.put(d)
    await resetTimer()
  })
}
