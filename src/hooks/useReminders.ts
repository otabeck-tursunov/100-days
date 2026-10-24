import { useEffect } from 'react'
import type { Settings } from '../db/types'
import { notify } from '../lib/notifications'
import { toKey } from '../lib/dates'

const KEY = 'reminders-fired'
/** Vaqtdan keyin shuncha daqiqa ichida ochilsa ham eslatma ko'rsatiladi */
const GRACE_MIN = 30

function loadFired(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {}
  }
}

/**
 * Brauzer yopiq bo'lsa ishlamaydi: eslatmalar ilova (yoki uning oynasi) ochiq
 * turganda tekshiriladi. Tushuntirish Sozlamalar sahifasida.
 */
export function useReminders(s: Settings) {
  useEffect(() => {
    const check = () => {
      const now = new Date()
      const date = toKey(now)
      const minutes = now.getHours() * 60 + now.getMinutes()
      const fired = loadFired()
      const rules = [
        { id: 'morning', on: s.remindMorning, time: s.morningTime, title: 'Tongi navbat', body: "Turish vaqti! Tongi navbatni boshlang." },
        { id: 'evening', on: s.remindEvening, time: s.eveningTime, title: 'Kechki tekshiruv', body: 'Kuryerlikni to\'xtating va kunni yakunlang.' },
      ]
      for (const r of rules) {
        if (!r.on || fired[r.id] === date) continue
        const [h, m] = r.time.split(':').map(Number)
        const diff = minutes - (h * 60 + m)
        if (diff >= 0 && diff <= GRACE_MIN) {
          fired[r.id] = date
          localStorage.setItem(KEY, JSON.stringify(fired))
          void notify(r.title, r.body, `reminder-${r.id}`)
        }
      }
    }
    check()
    const id = setInterval(check, 20_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [s.remindMorning, s.remindEvening, s.morningTime, s.eveningTime])
}
