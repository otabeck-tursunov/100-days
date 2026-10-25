import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '../lib/categories'
import { formatMoney } from '../lib/format'

/** Kechki tahlilda: tanlangan kunning barcha sarflari + tez qo'shish. Moliya sahifasi bilan umumiy ma'lumot. */
export function DayExpenses({ date }: { date: string }) {
  const list = useLiveQuery(async () => (await db.transactions.where('date').equals(date).toArray()).filter((t) => !t.deleted), [date]) ?? []
  const expenses = list.filter((t) => t.type === 'expense')
  const total = expenses.reduce((a, t) => a + t.amount, 0)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES.expense[0])
  const [note, setNote] = useState('')

  // oldin ishlatilgan o'z toifalarimiz ham chiqsin
  const used = useLiveQuery(async () => {
    const all = (await db.transactions.toArray()).filter((t) => !t.deleted)
    return [...new Set(all.filter((t) => t.type === 'expense' && t.category).map((t) => t.category!))]
  }) ?? []
  const categories = [...new Set([...DEFAULT_CATEGORIES.expense, ...used])]

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(amount.replace(/\D/g, '') || '0', 10)
    if (!n) return
    await db.transactions.add({
      id: crypto.randomUUID(), date, type: 'expense', amount: n,
      note: note.trim(), category: category || FALLBACK_CATEGORY,
    })
    setAmount('')
    setNote('')
  }

  return (
    <div className="mt-6 border-t border-line pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-semibold tracking-tight">Bugungi sarflar</h3>
        <span className="text-sm tabular-nums text-muted">{formatMoney(total)} so'm</span>
      </div>

      <ul className="mb-4 divide-y divide-line">
        {expenses.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-sm">{t.category || FALLBACK_CATEGORY}{t.note ? <span className="text-muted"> · {t.note}</span> : null}</div>
            </div>
            <span className="text-sm tabular-nums">{formatMoney(t.amount)}</span>
            <button
              className="btn !min-h-9 !px-3"
              aria-label="O'chirish"
              onClick={() => confirm("Sarf o'chirilsinmi?") && db.transactions.update(t.id, { deleted: true })}
            >
              ✕
            </button>
          </li>
        ))}
        {!expenses.length && <li className="py-2 text-sm text-muted">Bu kunga sarf yozilmagan.</li>}
      </ul>

      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[8rem_1fr_1fr_auto]">
        <input
          className="input"
          inputMode="numeric"
          placeholder="Summa"
          aria-label="Sarf summasi"
          value={amount ? formatMoney(parseInt(amount.replace(/\D/g, '') || '0', 10)) : ''}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select className="input" aria-label="Toifa" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input" placeholder="Izoh (ixtiyoriy)" aria-label="Izoh" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn btn-primary" type="submit" disabled={!amount}>Qo'shish</button>
      </form>
    </div>
  )
}
