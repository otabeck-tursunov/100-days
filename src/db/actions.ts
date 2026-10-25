import { db } from './db'
import { emptyDay, type DayRecord, type Item, type Section, type Settings } from './types'
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

/** Bandni belgilaydi/olib tashlaydi. extra — shu yozuvning o'zida qo'shimcha o'zgarish (masalan, vaqt). */
export const toggleCheck = (date: string, itemId: string, extra?: (d: DayRecord, nowChecked: boolean) => void) =>
  patchDay(date, (d) => {
    const next = !d.checks[itemId]
    d.checks = { ...d.checks, [itemId]: next }
    extra?.(d, next)
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
