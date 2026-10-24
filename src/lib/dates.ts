/** Kun yarim tunda emas, soat 03:00 da almashadi. */
export const ROLLOVER_HOUR = 3

const WEEKDAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
]

const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Hozirgi "mantiqiy" kun (03:00 gacha oldingi kun hisoblanadi). */
export const logicalDate = (now: number | Date = Date.now()) =>
  toKey(new Date(new Date(now).getTime() - ROLLOVER_HOUR * 3600_000))

export function addDays(key: string, n: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

/** a - b (kunlarda) */
export const diffDays = (a: string, b: string) =>
  Math.round((parseKey(a).getTime() - parseKey(b).getTime()) / 86400000)

export function formatLong(key: string) {
  const d = parseKey(key)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}-${MONTHS[d.getMonth()]}`
}

/** 'YYYY-MM' → "oktabr 2026" */
export function formatMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function addMonths(ym: string, n: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function formatFull(key: string) {
  return `${formatLong(key)}, ${parseKey(key).getFullYear()}`
}
