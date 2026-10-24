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

/** Fayldan tiklaydi; mavjud ma'lumotlar almashtiriladi. Xato bo'lsa Error tashlaydi. */
export async function importBackup(file: File) {
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Fayl JSON formatida emas')
  }
  if (data?.app !== APP || !Array.isArray(data.items) || !Array.isArray(data.days) || !Array.isArray(data.settings)) {
    throw new Error("Bu 'Kunlik Navbat' zaxira fayli emas")
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
