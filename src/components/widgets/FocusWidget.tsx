import { patchDay } from '../../db/actions'
import { formatHours } from '../../lib/format'
import type { WidgetProps } from './Widgets'

/** Full Stack bandida ishlangan vaqt (daqiqa) ni qo'lda yozish. */
export function FocusWidget({ date, day }: WidgetProps) {
  const set = (n: number) => patchDay(date, (d) => void (d.focusMinutes = Math.max(0, n)))
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Ishlangan vaqt (daqiqa):</span>
      <input
        className="input !w-24 text-center"
        inputMode="numeric"
        aria-label="Ishlangan vaqt, daqiqa"
        placeholder="0"
        value={day.focusMinutes || ''}
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
      />
      <button className="btn !min-h-10 !px-3" onClick={() => set(120)}>2 soat</button>
      {day.focusMinutes > 0 && <span className="text-muted">= {formatHours(day.focusMinutes)}</span>}
    </div>
  )
}
