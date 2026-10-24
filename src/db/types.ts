export type Section = 'morning' | 'evening'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ItemKind =
  | 'normal'
  | 'plan'
  | 'focus'
  | 'book'
  | 'courier'
  | 'learned'
  | 'obstacle'
  | 'tomorrow'

export interface Item {
  id: string
  section: Section
  title: string
  order: number
  kind: ItemKind
  /** Bandni qo'shilgan kun (YYYY-MM-DD). Shundan oldingi kunlarga ta'sir qilmaydi. */
  createdDay: string
  /** O'chirilgan kun. Shu kundan boshlab ko'rinmaydi, tarix saqlanadi. */
  archivedDay: string | null
}

export interface Settings {
  id: 'main'
  startDate: string
  theme: ThemeMode
  focusMinutes: number
  /** Kun "bajarilgan" hisoblanishi uchun minimal foiz (streak uchun) */
  streakThreshold: number
  remindMorning: boolean
  remindEvening: boolean
  morningTime: string
  eveningTime: string
}

export interface DayRecord {
  date: string
  checks: Record<string, boolean>
  learned: string
  obstacle: string
  tomorrow: string[]
  planDone: boolean[]
  pages: number
  focusMinutes: number
  earnings: number | null
}

export interface TimerState {
  id: 'focus'
  status: 'idle' | 'running' | 'paused'
  date: string
  targetMs: number
  accumulatedMs: number
  startedAt: number | null
}

/** Kirim (kuryerlikdan tashqari, odatda yirik) yoki xarajat */
export interface Transaction {
  id: string
  date: string
  type: 'income' | 'expense'
  amount: number
  note: string
  /** Toifa (eski yozuvlarda bo'lmasligi mumkin) */
  category?: string
}

/** Kutilayotgan to'lov: menga to'lanadi (receivable) yoki men to'lashim kerak (payable) */
export interface Pending {
  id: string
  direction: 'receivable' | 'payable'
  amount: number
  who: string
  note: string
  dueDate: string | null
  status: 'open' | 'done'
  createdDay: string
}

export const emptyDay =(date: string): DayRecord => ({
  date,
  checks: {},
  learned: '',
  obstacle: '',
  tomorrow: ['', '', ''],
  planDone: [false, false, false],
  pages: 0,
  focusMinutes: 0,
  earnings: null,
})
