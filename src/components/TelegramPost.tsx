import { useState } from 'react'
import type { DayRecord, Item } from '../db/types'
import { useAppData } from '../hooks/useAppData'
import { formatHours } from '../lib/format'
import { dayNumber } from '../lib/stats'

/** Faqat TONG natijalari: kechki bo'lim, kuryerlik va sarflar postga kirmaydi. */
function buildPost(n: number, morning: Item[], day: DayRecord): string {
  const done = morning.filter((i) => day.checks[i.id] && !/telegram/i.test(i.title))
  const lines = done.map((i) => {
    if (i.kind === 'focus') return `• Full Stack${day.focusMinutes ? `: ${formatHours(day.focusMinutes)} deep fokus` : ''}`
    if (i.kind === 'book') return `• Kitob${day.pages ? `: ${day.pages} sahifa` : ''}`
    if (i.kind === 'plan') return '• Kunni rejalashtirdim'
    return `• ${i.title}`
  })
  const total = morning.filter((i) => !/telegram/i.test(i.title)).length
  const head = n >= 1 && n <= 100 ? `Kun ${n}/100 🚀` : 'Bugun 🚀'
  return [
    head,
    '',
    'Tongi natijalar:',
    ...(lines.length ? lines : ['• Hali hech narsa belgilanmagan']),
    '',
    `Tongi navbat: ${done.length}/${total}`,
    '',
    '#100kun #fullstack',
  ].join('\n')
}

export function TelegramPost({ date, morning, day }: { date: string; morning: Item[]; day: DayRecord }) {
  const { settings } = useAppData()
  const n = dayNumber(settings.startDate, date)
  // qo'lda tahrirlanmagan bo'lsa, matn belgilarga qarab o'zi yangilanadi
  const [custom, setCustom] = useState<string | null>(null)
  const text = custom ?? buildPost(n, morning, day)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard ruxsati yo'q: matnni qo'lda belgilab nusxalash mumkin */
    }
  }

  return (
    <details className="mt-6 border-t border-line pt-5">
      <summary className="cursor-pointer font-semibold tracking-tight">Telegram post (faqat tong natijasi)</summary>
      <div className="mt-3 space-y-3">
        <textarea
          className="input min-h-44 resize-y font-mono !text-sm"
          aria-label="Telegram post matni"
          value={text}
          onChange={(e) => setCustom(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={copy}>{copied ? 'Nusxalandi ✓' : 'Nusxalash'}</button>
          <button className="btn" onClick={() => setCustom(null)} disabled={custom === null}>Belgilarga qarab qayta yaratish</button>
        </div>
        <p className="text-xs text-muted">Matnni xohlagancha tahrirlang. Kuryerlik, sarflar va kechki yozuvlar bu postga kirmaydi.</p>
      </div>
    </details>
  )
}
