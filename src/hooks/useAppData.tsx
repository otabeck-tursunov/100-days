import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { DayRecord, Item, Settings } from '../db/types'
import { logicalDate } from '../lib/dates'
import { useNow } from './useNow'

interface AppData {
  settings: Settings
  items: Item[]
  days: Map<string, DayRecord>
  today: string
}

const Ctx = createContext<AppData | null>(null)

export function AppDataProvider({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const settings = useLiveQuery(() => db.settings.get('main'))
  const items = useLiveQuery(() => db.items.toArray())
  const dayList = useLiveQuery(() => db.days.toArray())
  const now = useNow(15_000)
  const today = logicalDate(now)

  const days = useMemo(() => new Map((dayList ?? []).map((d) => [d.date, d])), [dayList])

  if (!settings || !items || !dayList) return <>{fallback}</>
  return <Ctx.Provider value={{ settings, items, days, today }}>{children}</Ctx.Provider>
}

export function useAppData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AppDataProvider topilmadi')
  return v
}
