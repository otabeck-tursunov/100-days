import { mergeFinanceData } from './backup'
import type { Pending, Transaction } from './types'

/**
 * Havola orqali moliya yozuvlarini qo'shish: `#import=<base64url>`.
 * Ma'lumot URL ning # qismida bo'ladi, shuning uchun serverga umuman yuborilmaydi va saytda saqlanmaydi.
 * Format: { v: 1, t: [[id, sana, 'income'|'expense', summa, izoh, toifa]], p: [[id, 'receivable'|'payable', summa, kim, izoh, muddat]] }
 */

const str = (x: unknown) => typeof x === 'string'
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x) && x >= 0
const date = (x: unknown) => str(x) && /^\d{4}-\d{2}-\d{2}$/.test(x as string)

function decode(b64url: string): any {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))))
}

function expand(raw: any): { transactions: Transaction[]; pending: Pending[] } {
  if (raw?.v !== 1 || !Array.isArray(raw.t) || !Array.isArray(raw.p)) throw new Error('Havola formati noto\'g\'ri')
  const transactions = raw.t.map((r: unknown[]): Transaction => {
    const [id, d, type, amount, note, category] = r
    if (!str(id) || !date(d) || (type !== 'income' && type !== 'expense') || !num(amount) || !str(note) || !str(category)) {
      throw new Error('Havoladagi yozuv noto\'g\'ri')
    }
    return { id: id as string, date: d as string, type, amount: amount as number, note: note as string, category: category as string }
  })
  const pending = raw.p.map((r: unknown[]): Pending => {
    const [id, direction, amount, who, note, due] = r
    if (!str(id) || (direction !== 'receivable' && direction !== 'payable') || !num(amount) || !str(who) || !str(note) || !(due === null || date(due))) {
      throw new Error('Havoladagi yozuv noto\'g\'ri')
    }
    return { id: id as string, direction, amount: amount as number, who: who as string, note: note as string, dueDate: due as string | null, status: 'open', createdDay: '2026-10-25' }
  })
  return { transactions, pending }
}

/** Havolada import bo'lsa, tasdiq so'rab qo'shadi va natija matnini qaytaradi; bo'lmasa null. */
export async function importFromHash(): Promise<string | null> {
  const m = location.hash.match(/^#import=([A-Za-z0-9_-]+)$/)
  if (!m) return null
  // havolani manzildan olib tashlaymiz (orqaga bosilganda qayta ishlamasin) va Moliya sahifasiga o'tamiz
  const clear = () => {
    history.replaceState(null, '', location.pathname + location.search + '#finance')
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  try {
    const data = expand(decode(m[1]))
    const total = data.transactions.length + data.pending.length
    if (!confirm(`Havolada ${total} ta moliya yozuvi bor (kreditlar va qoldiq). Qo'shilsinmi? Mavjud ma'lumot o'chmaydi.`)) {
      clear()
      return 'Import bekor qilindi.'
    }
    const added = await mergeFinanceData(data)
    clear()
    return added ? `${added} ta moliya yozuvi qo'shildi.` : "Yangi yozuv yo'q: hammasi allaqachon bor."
  } catch (e) {
    clear()
    return `Importda xato: ${(e as Error).message}`
  }
}
