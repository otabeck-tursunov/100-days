import type { DayRecord, Item, Pending, Settings, Transaction } from '../db/types'

export interface Snapshot {
  settings: Settings[]
  items: Item[]
  days: DayRecord[]
  transactions: Transaction[]
  pending: Pending[]
}

export const emptySnapshot = (): Snapshot => ({ settings: [], items: [], days: [], transactions: [], pending: [] })

const ts = (x: { updatedAt?: number }) => x.updatedAt ?? 0

/** Yozuv bo'yicha "oxirgi yozgan yutadi". Teng bo'lsa mahalliy (a) qoladi. */
function lww<T extends { updatedAt?: number }>(a: T[], b: T[], key: (x: T) => string): T[] {
  const map = new Map(a.map((x) => [key(x), x]))
  for (const x of b) {
    const cur = map.get(key(x))
    if (!cur || ts(x) > ts(cur)) map.set(key(x), x)
  }
  return [...map.values()]
}

const longer = (a: string, b: string) => (b.length > a.length ? b : a)

type Side = 'a' | 'b' | 'tie'

/** Qaysi tomonning maydoni yangiroq: fieldAt bo'lmasa yozuvning updatedAt si olinadi. */
function newer(a: DayRecord, b: DayRecord, key: string, hasA = true, hasB = true): Side {
  const ta = hasA ? (a.fieldAt?.[key] ?? ts(a)) : -1
  const tb = hasB ? (b.fieldAt?.[key] ?? ts(b)) : -1
  return ta > tb ? 'a' : tb > ta ? 'b' : 'tie'
}

/**
 * Kun yozuvi maydon bo'yicha birlashtiriladi: har bir belgi va matn o'z vaqti bo'yicha hal bo'ladi,
 * shuning uchun ikki qurilma bir kunning turli bandlarini o'zgartirsa ikkalasi ham saqlanadi.
 * Vaqti teng (eski ma'lumot) bo'lsa hech narsa yo'qolmasligi uchun: belgi = YOKI, matn = uzunrog'i, son = kattasi.
 */
function mergeDay(a: DayRecord, b: DayRecord): DayRecord {
  const pick = <T,>(key: string, va: T, vb: T, tie: (x: T, y: T) => T): T => {
    const s = newer(a, b, key)
    return s === 'a' ? va : s === 'b' ? vb : tie(va, vb)
  }

  const checks: Record<string, boolean> = {}
  for (const id of new Set([...Object.keys(a.checks), ...Object.keys(b.checks)])) {
    const k = `checks.${id}`
    const inA = id in a.checks
    const inB = id in b.checks
    const s = newer(a, b, k, inA, inB)
    checks[id] = s === 'a' ? !!a.checks[id] : s === 'b' ? !!b.checks[id] : !!a.checks[id] || !!b.checks[id]
  }

  const fieldAt: Record<string, number> = { ...(b.fieldAt ?? {}) }
  for (const [k, v] of Object.entries(a.fieldAt ?? {})) fieldAt[k] = Math.max(v, fieldAt[k] ?? 0)

  const earn = (x: number | null, y: number | null) => (x == null ? y : y == null ? x : Math.max(x, y))
  return {
    date: a.date,
    updatedAt: Math.max(ts(a), ts(b)),
    ...(Object.keys(fieldAt).length ? { fieldAt } : {}),
    checks,
    learned: pick('learned', a.learned ?? '', b.learned ?? '', longer),
    obstacle: pick('obstacle', a.obstacle ?? '', b.obstacle ?? '', longer),
    tomorrow: [0, 1, 2].map((i) => pick(`tomorrow.${i}`, a.tomorrow?.[i] ?? '', b.tomorrow?.[i] ?? '', longer)),
    planDone: [0, 1, 2].map((i) => pick(`planDone.${i}`, !!a.planDone?.[i], !!b.planDone?.[i], (x, y) => x || y)),
    pages: pick('pages', a.pages ?? 0, b.pages ?? 0, Math.max),
    focusMinutes: pick('focusMinutes', a.focusMinutes ?? 0, b.focusMinutes ?? 0, Math.max),
    earnings: pick('earnings', a.earnings ?? null, b.earnings ?? null, earn),
  }
}

function mergeDays(a: DayRecord[], b: DayRecord[]): DayRecord[] {
  const map = new Map(a.map((x) => [x.date, x]))
  for (const x of b) {
    const cur = map.get(x.date)
    map.set(x.date, cur ? mergeDay(cur, x) : x)
  }
  return [...map.values()]
}

export function mergeSnapshots(local: Snapshot, remote: Snapshot): Snapshot {
  return {
    settings: lww(local.settings, remote.settings, (s) => s.id),
    items: lww(local.items, remote.items, (i) => i.id),
    days: mergeDays(local.days, remote.days),
    transactions: lww(local.transactions, remote.transactions, (t) => t.id),
    pending: lww(local.pending, remote.pending, (p) => p.id),
  }
}

const stable = (v: unknown): string =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val).sort(([x], [y]) => x.localeCompare(y)))
      : val,
  )

const keyed = <T>(list: T[], key: (x: T) => string) => [...list].sort((x, y) => key(x).localeCompare(key(y)))

export const canonical = (s: Snapshot): string =>
  stable({
    settings: keyed(s.settings, (x) => x.id),
    items: keyed(s.items, (x) => x.id),
    days: keyed(s.days, (x) => x.date),
    transactions: keyed(s.transactions, (x) => x.id),
    pending: keyed(s.pending, (x) => x.id),
  })

export const recordKey = (table: keyof Snapshot, r: any): string => (table === 'days' ? r.date : r.id)
export const recordJson = (r: unknown) => stable(r)
