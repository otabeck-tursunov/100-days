import { emptyDay, type DayRecord } from './types'

const SCALARS = ['learned', 'obstacle', 'pages', 'focusMinutes', 'earnings'] as const

/**
 * Kun yozuvida nima o'zgarganini aniqlab, har bir o'zgargan maydonga alohida vaqt tamg'asi qo'yadi
 * (fieldAt). Shu tufayli ikki qurilma bir kunning turli bandlarini o'zgartirsa, ikkalasi ham saqlanadi.
 */
export function stampDay(before: DayRecord | undefined, after: DayRecord, now = Date.now()) {
  const b = before ?? emptyDay(after.date)
  const at = { ...(after.fieldAt ?? {}) }
  for (const id of new Set([...Object.keys(b.checks), ...Object.keys(after.checks)])) {
    if (!!b.checks[id] !== !!after.checks[id]) at[`checks.${id}`] = now
  }
  for (const k of SCALARS) if (b[k] !== after[k]) at[k] = now
  for (let i = 0; i < 3; i++) {
    if ((b.tomorrow[i] ?? '') !== (after.tomorrow[i] ?? '')) at[`tomorrow.${i}`] = now
    if (!!b.planDone[i] !== !!after.planDone[i]) at[`planDone.${i}`] = now
  }
  after.fieldAt = at
}
