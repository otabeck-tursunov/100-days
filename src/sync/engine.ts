import { useSyncExternalStore } from 'react'
import { db } from '../db/db'
import { canonical, emptySnapshot, mergeSnapshots, recordJson, recordKey, type Snapshot } from './merge'
import { AuthError, fetchRemote, getConfig, getSession, NetworkError, pushRemote } from './remote'

export interface SyncStatus {
  state: 'unconfigured' | 'signedout' | 'idle' | 'syncing' | 'ok' | 'offline' | 'error'
  message?: string
  lastSync?: number
}

const FORCE_KEY = 'sync-force'
const LAST_KEY = 'sync-last'
const TABLES = ['settings', 'items', 'days', 'transactions', 'pending'] as const

/* ---------- holat (UI uchun) ---------- */

let status: SyncStatus = { state: 'idle', lastSync: Number(localStorage.getItem(LAST_KEY)) || undefined }
const listeners = new Set<() => void>()
const setStatus = (s: Partial<SyncStatus>) => {
  status = { ...status, ...s }
  listeners.forEach((l) => l())
}
export const useSyncStatus = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => status,
  )

/* ---------- mahalliy o'zgarishlarni belgilash ---------- */

let onChange: () => void = () => {}

/**
 * Har bir yozuvga updatedAt qo'yadi (oxirgi yozgan yutadi qoidasi uchun).
 * Sinxronlashning o'zi yozayotganda (trans.source === 'sync') tegmaydi.
 */
export function installSyncHooks() {
  for (const name of TABLES) {
    const table = db[name] as any
    table.hook('creating', (_pk: unknown, obj: any, trans: any) => {
      if (trans?.source === 'sync') return
      if (obj.updatedAt == null) obj.updatedAt = Date.now()
      onChange()
    })
    table.hook('updating', (_mods: unknown, _pk: unknown, _obj: unknown, trans: any) => {
      if (trans?.source === 'sync') return
      onChange()
      return { updatedAt: Date.now() }
    })
  }
}

/** Qayta tiklash (hammasini almashtirish)dan keyin bulutni mahalliy nusxa bilan to'liq almashtirish. */
export const markForcePush = () => localStorage.setItem(FORCE_KEY, '1')

/* ---------- mahalliy baza bilan ishlash ---------- */

async function readLocal(): Promise<Snapshot> {
  const [settings, items, days, transactions, pending] = await Promise.all(TABLES.map((t) => (db[t] as any).toArray()))
  return { settings, items, days, transactions, pending }
}

async function applyLocal(merged: Snapshot, local: Snapshot) {
  await db.transaction('rw', [db.settings, db.items, db.days, db.transactions, db.pending], async (tx) => {
    ;(tx as any).source = 'sync'
    for (const name of TABLES) {
      const table = db[name] as any
      const localMap = new Map((local[name] as any[]).map((r) => [recordKey(name, r), r]))
      const toPut: any[] = []
      for (const rec of merged[name] as any[]) {
        const key = recordKey(name, rec)
        const before = localMap.get(key)
        if (before && recordJson(before) === recordJson(rec)) continue
        // oraliqda foydalanuvchi shu yozuvni o'zgartirgan bo'lsa tegmaymiz, keyingi aylanishda hal bo'ladi
        const now = await table.get(key)
        if (now && before && recordJson(now) !== recordJson(before)) continue
        toPut.push(rec)
      }
      if (toPut.length) await table.bulkPut(toPut)
    }
  })
}

/* ---------- asosiy sinxronlash ---------- */

let running = false
let again = false

export async function syncNow(): Promise<void> {
  if (!getConfig()) return setStatus({ state: 'unconfigured', message: undefined })
  if (!getSession()) return setStatus({ state: 'signedout', message: undefined })
  if (running) {
    again = true
    return
  }
  running = true
  setStatus({ state: 'syncing', message: undefined })
  try {
    const force = localStorage.getItem(FORCE_KEY) === '1'
    for (let attempt = 0; attempt < 5; attempt++) {
      const remote = await fetchRemote()
      const local = await readLocal()
      const remoteData = remote?.data ?? emptySnapshot()
      const merged = force ? local : mergeSnapshots(local, remoteData)

      if (canonical(merged) !== canonical(local)) await applyLocal(merged, local)
      const needPush = force || !remote || canonical(merged) !== canonical(remoteData)
      if (!needPush || (await pushRemote(merged, remote?.version ?? null))) {
        localStorage.removeItem(FORCE_KEY)
        const lastSync = Date.now()
        localStorage.setItem(LAST_KEY, String(lastSync))
        setStatus({ state: 'ok', lastSync, message: undefined })
        return
      }
      // boshqa qurilma oraliqda yozdi: qayta o'qib birlashtiramiz
    }
    setStatus({ state: 'error', message: 'Sinxronlash band, birozdan keyin qayta uriniladi' })
  } catch (e) {
    if (e instanceof NetworkError) setStatus({ state: 'offline', message: e.message })
    else if (e instanceof AuthError) setStatus({ state: 'signedout', message: e.message })
    else setStatus({ state: 'error', message: (e as Error).message })
  } finally {
    running = false
    if (again) {
      again = false
      setTimeout(() => void syncNow(), 500)
    }
  }
}

/** Ilova ochiq turganda: boshlanishda, fokusda, internet qaytganda, har daqiqada va o'zgarishdan keyin. */
export function startSync() {
  let debounce: number | undefined
  onChange = () => {
    window.clearTimeout(debounce)
    debounce = window.setTimeout(() => void syncNow(), 2500)
  }
  const run = () => void syncNow()
  const onVisible = () => !document.hidden && run()
  run()
  const interval = window.setInterval(run, 60_000)
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.clearInterval(interval)
    window.clearTimeout(debounce)
    window.removeEventListener('online', run)
    document.removeEventListener('visibilitychange', onVisible)
    onChange = () => {}
  }
}
