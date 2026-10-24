import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Pending, Transaction } from '../db/types'
import { useAppData } from '../hooks/useAppData'
import { addMonths, formatLong, formatMonth } from '../lib/dates'
import { formatMoney } from '../lib/format'
import { COURIER_CATEGORY, DEFAULT_CATEGORIES, FALLBACK_CATEGORY } from '../lib/categories'

const num = (s: string) => parseInt(s.replace(/\D/g, '') || '0', 10)

function MoneyInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        inputMode="numeric"
        placeholder="0"
        value={value ? formatMoney(value) : ''}
        onChange={(e) => onChange(num(e.target.value))}
      />
    </label>
  )
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-500' : tone === 'bad' ? 'text-red-500' : ''
  return (
    <div className="card !p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{formatMoney(value)} <span className="text-sm font-normal text-muted">so'm</span></div>
    </div>
  )
}

function TransactionForm({ today, txs }: { today: string; txs: Transaction[] }) {
  const [type, setType] = useState<Transaction['type']>('expense')
  const [amount, setAmount] = useState(0)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today)
  const [category, setCategory] = useState('')

  // standart toifalar + oldin ishlatilgan o'z toifalaringiz
  const used = txs.filter((t) => t.type === type && t.category).map((t) => t.category!)
  const chips = [...new Set([...DEFAULT_CATEGORIES[type], ...used])]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    await db.transactions.add({
      id: crypto.randomUUID(), date, type, amount, note: note.trim(),
      category: category.trim() || FALLBACK_CATEGORY,
    })
    setAmount(0)
    setNote('')
  }

  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-semibold">Yangi yozuv</h2>
      <div className="flex gap-2" role="radiogroup" aria-label="Turi">
        <button type="button" role="radio" aria-checked={type === 'expense'} className={`btn flex-1 ${type === 'expense' ? 'btn-primary' : ''}`} onClick={() => { setType('expense'); setCategory('') }}>
          − Xarajat
        </button>
        <button type="button" role="radio" aria-checked={type === 'income'} className={`btn flex-1 ${type === 'income' ? 'btn-primary' : ''}`} onClick={() => { setType('income'); setCategory('') }}>
          + Kirim
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <MoneyInput label="Summa (so'm)" value={amount} onChange={setAmount} />
        <label>
          <span className="label">Sana</span>
          <input type="date" className="input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
      </div>
      <div>
        <span className="label">Toifa</span>
        <div className="mb-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Toifa">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${category === c ? 'border-transparent bg-accent text-white' : 'border-line bg-surface2'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <input className="input" placeholder="Yoki yangi toifa yozing…" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <label className="block">
        <span className="label">Izoh ({type === 'income' ? 'qayerdan: maosh, dars, loyiha…' : 'nimaga: ovqat, yo\'l, benzin…'})</span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={!amount}>Saqlash</button>
      <p className="text-xs text-muted">Kuryerlik daromadi alohida: uni “Bugun” sahifasidagi kechki ro'yxatdan kiritasiz.</p>
    </form>
  )
}

function PendingSection({ today }: { today: string }) {
  const list = useLiveQuery(() => db.pending.toArray()) ?? []
  const [direction, setDirection] = useState<Pending['direction']>('receivable')
  const [amount, setAmount] = useState(0)
  const [who, setWho] = useState('')
  const [note, setNote] = useState('')
  const [due, setDue] = useState('')

  const open = list.filter((p) => p.status === 'open').sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))
  const sum = (d: Pending['direction']) => open.filter((p) => p.direction === d).reduce((a, p) => a + p.amount, 0)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    await db.pending.add({
      id: crypto.randomUUID(), direction, amount, who: who.trim(), note: note.trim(),
      dueDate: due || null, status: 'open', createdDay: today,
    })
    setAmount(0); setWho(''); setNote(''); setDue('')
  }

  /** Bajarilganda tegishli kirim/xarajat yozuvi avtomatik yaratiladi */
  const complete = async (p: Pending) => {
    await db.transaction('rw', db.pending, db.transactions, async () => {
      await db.pending.update(p.id, { status: 'done' })
      await db.transactions.add({
        id: crypto.randomUUID(), date: today, amount: p.amount,
        type: p.direction === 'receivable' ? 'income' : 'expense',
        category: FALLBACK_CATEGORY,
        note: [p.who, p.note].filter(Boolean).join(': ') || 'Kutilgan to\'lov',
      })
    })
  }

  return (
    <section className="card space-y-4">
      <h2 className="font-semibold">Kutilayotgan to'lovlar</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface2 p-3">
          <div className="text-xs text-muted">Menga to'lanishi kerak</div>
          <div className="font-bold text-emerald-500">{formatMoney(sum('receivable'))} so'm</div>
        </div>
        <div className="rounded-xl bg-surface2 p-3">
          <div className="text-xs text-muted">Men to'lashim kerak</div>
          <div className="font-bold text-red-500">{formatMoney(sum('payable'))} so'm</div>
        </div>
      </div>

      <ul className="space-y-2">
        {open.map((p) => {
          const late = p.dueDate && p.dueDate < today
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  <span className={p.direction === 'receivable' ? 'text-emerald-500' : 'text-red-500'}>
                    {p.direction === 'receivable' ? '↓' : '↑'} {formatMoney(p.amount)} so'm
                  </span>{' '}
                  {p.who && <span>· {p.who}</span>}
                </div>
                <div className="text-xs text-muted">
                  {p.note}{p.note && p.dueDate ? ' · ' : ''}
                  {p.dueDate && <span className={late ? 'font-semibold text-red-500' : ''}>muddat: {formatLong(p.dueDate)}{late ? ' (o\'tib ketgan)' : ''}</span>}
                </div>
              </div>
              <button className="btn !min-h-10" onClick={() => complete(p)}>
                {p.direction === 'receivable' ? '✓ Olindi' : '✓ To\'landi'}
              </button>
              <button className="btn !min-h-10 !px-3" aria-label="O'chirish" onClick={() => confirm('O\'chirilsinmi?') && db.pending.delete(p.id)}>🗑</button>
            </li>
          )
        })}
        {!open.length && <li className="text-sm text-muted">Kutilayotgan to'lovlar yo'q.</li>}
      </ul>
      <p className="text-xs text-muted">“Olindi / To'landi” bosilsa, shu summa bugungi kirim yoki xarajat sifatida avtomatik yoziladi.</p>

      <form onSubmit={add} className="space-y-3 border-t border-line pt-4">
        <div className="flex gap-2" role="radiogroup" aria-label="Yo'nalish">
          <button type="button" role="radio" aria-checked={direction === 'receivable'} className={`btn flex-1 ${direction === 'receivable' ? 'btn-primary' : ''}`} onClick={() => setDirection('receivable')}>
            Menga to'lanadi
          </button>
          <button type="button" role="radio" aria-checked={direction === 'payable'} className={`btn flex-1 ${direction === 'payable' ? 'btn-primary' : ''}`} onClick={() => setDirection('payable')}>
            Men to'layman
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyInput label="Summa (so'm)" value={amount} onChange={setAmount} />
          <label>
            <span className="label">Kim / qayerdan</span>
            <input className="input" value={who} onChange={(e) => setWho(e.target.value)} />
          </label>
          <label>
            <span className="label">Izoh</span>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <label>
            <span className="label">Muddat (ixtiyoriy)</span>
            <input type="date" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
        </div>
        <button className="btn btn-primary" type="submit" disabled={!amount}>Qo'shish</button>
      </form>
    </section>
  )
}

interface Row { name: string; sum: number }

function Breakdown({ title, rows, color, active, onPick }: {
  title: string
  rows: Row[]
  color: string
  active: string | null
  onPick: (name: string) => void
}) {
  const total = rows.reduce((a, r) => a + r.sum, 0)
  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-sm text-muted">{formatMoney(total)} so'm</span>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => {
          const pct = total ? (r.sum / total) * 100 : 0
          return (
            <li key={r.name}>
              <button
                className={`block w-full rounded-lg px-1 py-1 text-left transition hover:bg-surface2 ${active === r.name ? 'bg-surface2' : ''}`}
                onClick={() => onPick(r.name)}
                title="Bosing: yozuvlarni shu toifa bo'yicha filtrlash"
              >
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span>{r.name}</span>
                  <span className="shrink-0 text-muted">{formatMoney(r.sum)} · {Math.round(pct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </button>
            </li>
          )
        })}
        {!rows.length && <li className="text-sm text-muted">Bu oyda ma'lumot yo'q.</li>}
      </ul>
    </section>
  )
}

const group = (list: Transaction[], extra: Row[] = []): Row[] => {
  const m = new Map<string, number>()
  for (const t of list) {
    const k = t.category || FALLBACK_CATEGORY
    m.set(k, (m.get(k) ?? 0) + t.amount)
  }
  for (const r of extra) if (r.sum) m.set(r.name, (m.get(r.name) ?? 0) + r.sum)
  return [...m].map(([name, sum]) => ({ name, sum })).sort((a, b) => b.sum - a.sum)
}

export function FinancePage() {
  const { days, today } = useAppData()
  const [month, setMonth] = useState(today.slice(0, 7))
  const [filter, setFilter] = useState<{ type: Transaction['type']; name: string } | null>(null)
  const txs = useLiveQuery(() => db.transactions.toArray()) ?? []

  const inMonth = txs.filter((t) => t.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date))
  const income = inMonth.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const expense = inMonth.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const courier = [...days.values()].filter((d) => d.date.startsWith(month)).reduce((a, d) => a + (d.earnings ?? 0), 0)
  const balance = income + courier - expense

  const incomeRows = group(inMonth.filter((t) => t.type === 'income'), [{ name: COURIER_CATEGORY, sum: courier }])
  const expenseRows = group(inMonth.filter((t) => t.type === 'expense'))
  const toggle = (type: Transaction['type']) => (name: string) =>
    setFilter((f) => (f?.type === type && f.name === name ? null : { type, name }))
  const visible = filter
    ? inMonth.filter((t) => t.type === filter.type && (t.category || FALLBACK_CATEGORY) === filter.name)
    : inMonth

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Moliya</h1>
        <div className="flex items-center gap-2">
          <button className="btn !px-3" onClick={() => setMonth(addMonths(month, -1))} aria-label="Oldingi oy">←</button>
          <span className="min-w-32 text-center font-medium capitalize">{formatMonth(month)}</span>
          <button className="btn !px-3" onClick={() => setMonth(addMonths(month, 1))} aria-label="Keyingi oy">→</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary label="Kirimlar" value={income} tone="good" />
        <Summary label="Kuryerlik" value={courier} tone="good" />
        <Summary label="Xarajatlar" value={expense} tone="bad" />
        <Summary label="Balans" value={balance} tone={balance >= 0 ? 'good' : 'bad'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Breakdown title="Kirimlar toifalar bo'yicha" rows={incomeRows} color="#10b981" active={filter?.type === 'income' ? filter.name : null} onPick={toggle('income')} />
        <Breakdown title="Xarajatlar toifalar bo'yicha" rows={expenseRows} color="#ef4444" active={filter?.type === 'expense' ? filter.name : null} onPick={toggle('expense')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <TransactionForm today={today} txs={txs} />
          <section className="card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Yozuvlar{filter ? `: ${filter.name}` : ''}</h2>
              {filter && <button className="btn !min-h-9" onClick={() => setFilter(null)}>✕ Filtrni olib tashlash</button>}
            </div>
            <ul className="divide-y divide-line">
              {visible.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className={`font-medium ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '−'}{formatMoney(t.amount)} so'm
                    </div>
                    <div className="truncate text-xs text-muted">{formatLong(t.date)} · {t.category || FALLBACK_CATEGORY}{t.note ? ` · ${t.note}` : ''}</div>
                  </div>
                  <button className="btn !min-h-10 !px-3" aria-label="O'chirish" onClick={() => confirm('Yozuv o\'chirilsinmi?') && db.transactions.delete(t.id)}>🗑</button>
                </li>
              ))}
              {!visible.length && <li className="py-2 text-sm text-muted">Yozuv yo'q.</li>}
            </ul>
          </section>
        </div>
        <PendingSection today={today} />
      </div>
    </div>
  )
}
