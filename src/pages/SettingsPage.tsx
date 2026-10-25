import { useRef, useState } from 'react'
import { addItem, moveItem, removeItem, renameItem, updateSettings } from '../db/actions'
import { exportBackup, importBackup, mergeFinance } from '../db/backup'
import type { Item, Section, ThemeMode } from '../db/types'
import { DebouncedInput } from '../components/DebouncedInput'
import { SyncSection } from '../components/SyncSection'
import { useAppData } from '../hooks/useAppData'
import { useInstall } from '../hooks/useInstall'
import { notificationsSupported, notify, requestPermission } from '../lib/notifications'
import { itemsFor } from '../lib/stats'

const THEMES: [ThemeMode, string][] = [['light', 'Yorug\''], ['dark', 'Qorong\'i'], ['system', 'Tizim']]

function ItemList({ section, title }: { section: Section; title: string }) {
  const { items, today } = useAppData()
  const list = itemsFor(items, today, section)
  const [draft, setDraft] = useState('')

  const add = async () => {
    if (!draft.trim()) return
    await addItem(section, draft, today)
    setDraft('')
  }

  return (
    <div className={section === 'morning' ? 'sec-morning' : 'sec-evening'}>
      <h3 className="mb-2 font-semibold text-accent">{title}</h3>
      <ul className="space-y-2">
        {list.map((it: Item, i) => (
          <li key={it.id} className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <DebouncedInput value={it.title} ariaLabel="Band nomi" onSave={(v) => v.trim() && renameItem(it.id, v.trim())} />
            </div>
            <button className="btn !min-h-11 !px-3" disabled={i === 0} onClick={() => moveItem(list, it.id, -1)} aria-label="Yuqoriga">↑</button>
            <button className="btn !min-h-11 !px-3" disabled={i === list.length - 1} onClick={() => moveItem(list, it.id, 1)} aria-label="Pastga">↓</button>
            <button
              className="btn !min-h-11 !px-3"
              onClick={() => confirm(`“${it.title}” bandi o'chirilsinmi? O'tgan kunlar tarixi saqlanadi.`) && removeItem(it.id, today)}
              aria-label="O'chirish"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void add()
        }}
      >
        <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Yangi band qo'shish…" />
        <button className="btn btn-primary" type="submit">Qo'shish</button>
      </form>
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="size-5 accent-[var(--c-morning)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function SettingsPage() {
  const { settings: s } = useAppData()
  const { canInstall, installed, install } = useInstall()
  const fileRef = useRef<HTMLInputElement>(null)
  const mergeRef = useRef<HTMLInputElement>(null)
  const [perm, setPerm] = useState<string>(notificationsSupported() ? Notification.permission : 'unsupported')
  const [msg, setMsg] = useState('')

  const onImport = async (file?: File) => {
    if (!file) return
    if (!confirm("Joriy ma'lumotlar zaxira fayli bilan almashtiriladi. Davom etasizmi?")) return
    try {
      await importBackup(file)
      location.reload()
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  const onMerge = async (file?: File) => {
    if (!file) return
    try {
      const n = await mergeFinance(file)
      setMsg(n ? `${n} ta moliya yozuvi qo'shildi.` : "Yangi yozuv yo'q (hammasi allaqachon bor).")
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Sozlamalar</h1>

      <section className="card space-y-4">
        <h2 className="font-semibold">Challenge</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <label>
            <span className="label">Boshlanish sanasi</span>
            <input type="date" className="input" value={s.startDate} onChange={(e) => e.target.value && updateSettings({ startDate: e.target.value })} />
          </label>
          <label>
            <span className="label">Full Stack standart vaqti (daqiqa)</span>
            <input type="number" min={5} max={600} className="input" value={s.focusMinutes} onChange={(e) => updateSettings({ focusMinutes: Math.max(5, +e.target.value || 120) })} />
          </label>
          <label>
            <span className="label">Streak uchun minimal foiz</span>
            <input type="number" min={1} max={100} className="input" value={s.streakThreshold} onChange={(e) => updateSettings({ streakThreshold: Math.min(100, Math.max(1, +e.target.value || 80)) })} />
          </label>
        </div>
        <p className="text-xs text-muted">Kun soat 03:00 da almashadi: undan oldin belgilangan narsalar oldingi kunga yoziladi.</p>
        <div>
          <span className="label">Mavzu</span>
          <div className="inline-flex flex-wrap gap-2" role="radiogroup" aria-label="Mavzu">
            {THEMES.map(([v, l]) => (
              <button key={v} role="radio" aria-checked={s.theme === v} className={`btn ${s.theme === v ? 'btn-primary' : ''}`} onClick={() => updateSettings({ theme: v })}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-6">
        <h2 className="font-semibold">Ro'yxatlar</h2>
        <ItemList section="morning" title="Tongi navbat" />
        <ItemList section="evening" title="Kechki tekshiruv" />
        <p className="text-xs text-muted">O'chirilgan band bugundan boshlab yo'qoladi, o'tgan kunlardagi belgilar va statistika saqlanadi.</p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Eslatmalar</h2>
        {perm !== 'granted' && (
          <button
            className="btn btn-primary"
            disabled={perm === 'unsupported'}
            onClick={async () => setPerm(await requestPermission())}
          >
            Bildirishnomaga ruxsat berish
          </button>
        )}
        {perm === 'denied' && <p className="text-sm text-red-500">Ruxsat rad etilgan. Brauzer sayt sozlamalaridan yoqing.</p>}
        {perm === 'unsupported' && <p className="text-sm text-red-500">Bu brauzer bildirishnomalarni qo'llamaydi.</p>}
        <div className="grid gap-x-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Toggle checked={s.remindMorning} onChange={(v) => updateSettings({ remindMorning: v })} label="Tongi" />
            <input type="time" className="input !w-32" value={s.morningTime} onChange={(e) => e.target.value && updateSettings({ morningTime: e.target.value })} />
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={s.remindEvening} onChange={(v) => updateSettings({ remindEvening: v })} label="Kechki" />
            <input type="time" className="input !w-32" value={s.eveningTime} onChange={(e) => e.target.value && updateSettings({ eveningTime: e.target.value })} />
          </div>
        </div>
        <button className="btn" disabled={perm !== 'granted'} onClick={() => notify('100 kun', 'Sinov bildirishnomasi ishlayapti ✅', 'test')}>
          Sinab ko'rish
        </button>
        <div className="rounded-xl bg-surface2 p-3 text-sm text-muted">
          <b className="text-fg">Cheklovlar:</b> oddiy veb-ilova serverdan bildirishnoma yubora olmaydi, shuning uchun
          eslatma faqat ilova (yoki brauzer) <b>ishlab turganda</b> chiqadi. Ilova butunlay yopiq bo'lsa u chiqmaydi.
          Windows'da Chrome/Edge sozlamalarida “Yopilgandan keyin fon ilovalarini ishlatishni davom ettirish” va
          o'rnatilgan ilovani “Kirishda ishga tushirish” ni yoqsangiz, ishonchliroq ishlaydi. Androidda o'rnatilgan
          ilova ochiq/yaqinda ishlatilgan bo'lsa chiqadi, tejash rejimi (battery saver) to'sishi mumkin. iPhone'da
          bildirishnoma faqat “Bosh ekranga qo'shilgan” ilovada (iOS 16.4+) ishlaydi. Ishonchli eslatma uchun
          telefoningizning uyg'otgich/kalendar ilovasini ham ishlating.
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Ilovani o'rnatish</h2>
        {installed ? (
          <p className="text-sm text-muted">Ilova o'rnatilgan.</p>
        ) : canInstall ? (
          <button className="btn btn-primary" onClick={install}>Ilovani o'rnatish</button>
        ) : (
          <p className="text-sm text-muted">
            Chrome/Edge: manzil qatoridagi o'rnatish belgisi yoki menyu → “Ilovani o'rnatish”. iPhone (Safari): Ulashish
            → “Bosh ekranga qo'shish”. Android (Chrome): menyu → “Ilovani o'rnatish”.
          </p>
        )}
      </section>

      <SyncSection />

      <section className="card space-y-3">
        <h2 className="font-semibold">Zaxira nusxa</h2>
        <p className="text-sm text-muted">Ma'lumotlar faqat shu qurilmada saqlanadi. Kompyuter va telefon o'rtasida ko'chirish uchun eksport/import qiling.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={exportBackup}>JSON'ga eksport</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Fayldan tiklash</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { void onImport(e.target.files?.[0]); e.target.value = '' }} />
          <button className="btn" onClick={() => mergeRef.current?.click()}>Moliya yozuvlarini qo'shish</button>
          <input ref={mergeRef} type="file" accept="application/json,.json" hidden data-testid="merge-input" onChange={(e) => { void onMerge(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <p className="text-xs text-muted">“Fayldan tiklash” hamma narsani almashtiradi. “Moliya yozuvlarini qo'shish” esa mavjud ma'lumotni saqlab, faqat yangi kirim/xarajat va kutilayotgan to'lovlarni qo'shadi.</p>
        {msg && <p className="text-sm text-muted" role="status">{msg}</p>}
      </section>
    </div>
  )
}
