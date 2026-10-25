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
  updatedAt?: number
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
  updatedAt?: number
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
  updatedAt?: number
  /** Maydon bo'yicha oxirgi o'zgarish vaqti (sinxronlash uchun), masalan 'checks.m1' */
  fieldAt?: Record<string, number>
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
  updatedAt?: number
  /** Soft-delete: sinxronlash o'chirilganini boshqa qurilmalarga ham yetkazishi uchun */
  deleted?: boolean
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
  updatedAt?: number
  deleted?: boolean
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
