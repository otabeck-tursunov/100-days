import { db } from './db'
import { logicalDate } from '../lib/dates'

const APP = 'kunlik-navbat'

export async function exportBackup() {
  const data = {
    app: APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await db.settings.toArray(),
    items: await db.items.toArray(),
    days: await db.days.toArray(),
    timer: await db.timer.toArray(),
    transactions: await db.transactions.toArray(),
    pending: await db.pending.toArray(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kunlik-navbat-${logicalDate()}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Qo'shib import: mavjud ma'lumotlar saqlanadi, faqat moliya yozuvlari (transactions, pending)
 * qo'shiladi. Id si bor yozuv qayta yozilmaydi (to'langan holati buzilmaydi). Qo'shilganlar sonini qaytaradi.
 */
export async function mergeFinance(file: File) {
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Fayl JSON formatida emas')
  }
  if (data?.app !== APP) throw new Error("Bu '100 kun' fayli emas")
  const txs: any[] = Array.isArray(data.transactions) ? data.transactions : []
  const pend: any[] = Array.isArray(data.pending) ? data.pending : []
  let added = 0
  await db.transaction('rw', db.transactions, db.pending, async () => {
    const haveT = new Set(await db.transactions.toCollection().primaryKeys())
    const haveP = new Set(await db.pending.toCollection().primaryKeys())
    const newT = txs.filter((t) => t?.id && !haveT.has(t.id))
    const newP = pend.filter((p) => p?.id && !haveP.has(p.id))
    await db.transactions.bulkAdd(newT)
    await db.pending.bulkAdd(newP)
    added = newT.length + newP.length
  })
  return added
}

/** Fayldan tiklaydi; mavjud ma'lumotlar almashtiriladi. Xato bo'lsa Error tashlaydi. */
export async function importBackup(file: File) {
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Fayl JSON formatida emas')
  }
  if (data?.app !== APP || !Array.isArray(data.items) || !Array.isArray(data.days) || !Array.isArray(data.settings)) {
    throw new Error("Bu '100 kun' zaxira fayli emas")
  }
  await db.transaction('rw', [db.settings, db.items, db.days, db.timer, db.transactions, db.pending], async () => {
    await Promise.all([
      db.settings.clear(), db.items.clear(), db.days.clear(), db.timer.clear(),
      db.transactions.clear(), db.pending.clear(),
    ])
    if (Array.isArray(data.transactions)) await db.transactions.bulkPut(data.transactions)
    if (Array.isArray(data.pending)) await db.pending.bulkPut(data.pending)
    await db.settings.bulkPut(data.settings)
    await db.items.bulkPut(data.items)
    await db.days.bulkPut(data.days)
    if (Array.isArray(data.timer)) await db.timer.bulkPut(data.timer)
  })
}
