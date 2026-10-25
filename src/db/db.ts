import Dexie, { type Table } from 'dexie'
import type { DayRecord, Item, Pending, Settings, Transaction } from './types'
import { DEFAULT_ITEMS, DEFAULT_SETTINGS } from './defaults'

class AppDB extends Dexie {
  settings!: Table<Settings, string>
  items!: Table<Item, string>
  days!: Table<DayRecord, string>
  transactions!: Table<Transaction, string>
  pending!: Table<Pending, string>

  constructor() {
    super('kunlik-navbat')
    this.version(1).stores({
      settings: 'id',
      items: 'id, section, order',
      days: 'date',
      timer: 'id',
    })
    this.version(2).stores({
      transactions: 'id, date',
      pending: 'id, status',
    })
    // taymer olib tashlandi
    this.version(3).stores({ timer: null })
  }
}

export const db = new AppDB()

/** Birinchi ishga tushishda standart sozlamalar va ro'yxatlarni yozadi. */
export async function initDb() {
  await db.transaction('rw', db.settings, db.items, async () => {
    if (!(await db.settings.get('main'))) await db.settings.put(DEFAULT_SETTINGS)
    if ((await db.items.count()) === 0) await db.items.bulkPut(DEFAULT_ITEMS)
  })
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* ixtiyoriy */
  }
}
