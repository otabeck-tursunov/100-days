import { elapsedMs, finishTimer, patchDay, pauseTimer, resetTimer, startTimer } from '../../db/actions'
import { formatDuration, formatHours } from '../../lib/format'
import { useAppData } from '../../hooks/useAppData'
import { useNow } from '../../hooks/useNow'
import { useTimerState } from '../../hooks/useTimer'
import { requestPermission, notificationsSupported } from '../../lib/notifications'
import type { WidgetProps } from './Widgets'

export function FocusWidget({ date, day, isToday }: WidgetProps) {
  const { settings } = useAppData()
  const t = useTimerState()
  const running = t?.status === 'running'
  const now = useNow(running ? 500 : 60_000)

  const manual = (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Ishlangan vaqt (daqiqa):</span>
      <input
        className="input !w-24 text-center"
        inputMode="numeric"
        placeholder="0"
        value={day.focusMinutes || ''}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, '') || '0', 10)
          patchDay(date, (d) => void (d.focusMinutes = n))
        }}
      />
    </label>
  )
  if (!isToday) return manual

  const active = t && t.status !== 'idle'
  if (active && t.date !== date) {
    return <p className="text-sm text-muted">Taymer boshqa kun uchun ishlayapti ({t.date}).</p>
  }

  const targetMs = t?.targetMs || settings.focusMinutes * 60_000
  const left = active ? targetMs - elapsedMs(t, now) : targetMs
  const pct = active ? Math.min(100, (elapsedMs(t, now) / targetMs) * 100) : 0

  const start = async () => {
    if (notificationsSupported() && Notification.permission === 'default') void requestPermission()
    await startTimer(date, targetMs)
  }

  return (
    <div className="space-y-3 rounded-xl bg-accent-soft p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-3xl font-semibold tabular-nums" aria-live="off">
          {formatDuration(left)}
        </span>
        <span className="text-xs text-muted">
          Bugun jami: {formatHours(day.focusMinutes)}
          {t?.status === 'paused' && ' · pauzada'}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-2">
        {t?.status === 'running' ? (
          <button className="btn" onClick={pauseTimer}>⏸ Pauza</button>
        ) : (
          <button className="btn btn-primary" onClick={start}>
            ▶ {t?.status === 'paused' ? 'Davom etish' : 'Boshlash'}
          </button>
        )}
        {active && (
          <>
            <button className="btn" onClick={() => finishTimer(false)} title="Ishlangan vaqtni saqlab to'xtatish">
              ■ Tugatish
            </button>
            <button className="btn" onClick={resetTimer} title="Saqlamasdan bekor qilish">✕ Bekor</button>
          </>
        )}
      </div>
    </div>
  )
}
