import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { elapsedMs, finishTimer } from '../db/actions'
import { notify } from '../lib/notifications'
import { formatDuration } from '../lib/format'
import { useNow } from './useNow'

export const useTimerState = () => useLiveQuery(() => db.timer.get('focus'))

/**
 * Global kuzatuvchi: taymer tugaganini (ilova yopiq bo'lgan vaqtda tugagan bo'lsa ham)
 * aniqlab, bandni belgilaydi va daqiqalarni saqlaydi. Vaqt timestamp asosida hisoblanadi.
 */
export function useTimerWatcher() {
  const t = useTimerState()
  const running = t?.status === 'running'
  const now = useNow(running ? 1000 : 60_000)
  const finalizing = useRef(false)

  useEffect(() => {
    if (!t || t.status !== 'running' || finalizing.current) return
    if (elapsedMs(t, now) >= t.targetMs) {
      finalizing.current = true
      void finishTimer(true)
        .then(() => notify('Full Stack', 'Fokus vaqti tugadi. Barakalla!', 'focus-done'))
        .finally(() => (finalizing.current = false))
    }
  }, [t, now])

  useEffect(() => {
    if (!t || t.status !== 'running') return
    const base = document.title
    document.title = `${formatDuration(t.targetMs - elapsedMs(t, now))} · ${base}`
    return () => {
      document.title = base
    }
  }, [t, now])
}
