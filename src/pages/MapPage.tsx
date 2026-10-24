import { useAppData } from '../hooks/useAppData'
import { progress } from '../lib/stats'
import { addDays, formatFull } from '../lib/dates'

const LEVELS = [0, 25, 50, 75, 100]
const level = (pct: number) => (pct === 0 ? 0 : pct < 40 ? 1 : pct < 70 ? 2 : pct < 100 ? 3 : 4)
const cellBg = (l: number) =>
  l === 0 ? 'var(--c-surface2)' : `color-mix(in srgb, var(--c-morning) ${LEVELS[l] * 0.9 + 10}%, var(--c-surface2))`

export function MapPage() {
  const { settings, items, days, today } = useAppData()

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="mb-1 text-xl font-bold">100 kunlik xarita</h1>
        <p className="mb-4 text-sm text-muted">Katakni bosing — o'sha kun alohida sahifada ochiladi.</p>
        <div className="mx-auto grid max-w-3xl grid-cols-10 gap-1.5 sm:gap-2">
          {Array.from({ length: 100 }, (_, i) => {
            const date = addDays(settings.startDate, i)
            const future = date > today
            const pct = progress(items, date, days.get(date)).pct
            const l = future ? 0 : level(pct)
            return (
              <a
                key={date}
                href={`#day/${date}`}
                aria-label={`${i + 1}-kun, ${formatFull(date)}, ${future ? 'hali kelmagan' : pct + '%'}`}
                title={`${i + 1}-kun · ${future ? '—' : pct + '%'}`}
                className={`relative grid aspect-square place-items-center rounded-md text-[10px] font-medium transition hover:scale-110 sm:rounded-lg sm:text-xs ${
                  date === today ? 'ring-2 ring-fg' : ''
                } ${future ? 'opacity-40' : ''} ${l >= 3 ? 'text-white' : 'text-muted'}`}
                style={{ background: cellBg(l) }}
              >
                {i + 1}
              </a>
            )
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          Kam
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="size-4 rounded" style={{ background: cellBg(l) }} />
          ))}
          Ko'p
        </div>
      </div>

    </div>
  )
}
