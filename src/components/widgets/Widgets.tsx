import { patchDay, toggleCheck } from '../../db/actions'
import type { DayRecord, Item } from '../../db/types'
import { addDays } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { useAppData } from '../../hooks/useAppData'
import { DebouncedInput } from '../DebouncedInput'
import { FocusWidget } from './FocusWidget'

export interface WidgetProps {
  date: string
  day: DayRecord
  item: Item
  isToday: boolean
}

function PlanWidget({ date, day }: WidgetProps) {
  const { days } = useAppData()
  const prev = days.get(addDays(date, -1))
  const tasks = (prev?.tomorrow ?? []).map((t, i) => ({ t: t.trim(), i })).filter((x) => x.t)
  if (!tasks.length) {
    return <p className="text-sm text-muted">Kechagi kechqurun “ertangi vazifalar” yozilmagan.</p>
  }
  return (
    <ul className="space-y-1.5">
      {tasks.map(({ t, i }) => (
        <li key={i}>
          <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-5 accent-[var(--accent)]"
              checked={!!day.planDone[i]}
              onChange={(e) =>
                patchDay(date, (d) => {
                  const arr = [...d.planDone]
                  arr[i] = e.target.checked
                  d.planDone = arr
                })
              }
            />
            <span className={day.planDone[i] ? 'text-muted line-through' : ''}>{t}</span>
          </label>
        </li>
      ))}
    </ul>
  )
}

function BookWidget({ date, day }: WidgetProps) {
  const set = (n: number) => patchDay(date, (d) => void (d.pages = Math.max(0, n)))
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted">O'qilgan sahifa:</span>
      <input
        className="input !w-20 text-center"
        inputMode="numeric"
        aria-label="O'qilgan sahifalar"
        value={day.pages || ''}
        placeholder="0"
        onChange={(e) => set(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
      />
    </div>
  )
}

function CourierWidget({ date, day }: WidgetProps) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted">Kuryerlikdan topilgan (ixtiyoriy):</span>
      <span className="flex items-center gap-2">
        <input
          className="input !w-36"
          inputMode="numeric"
          placeholder="0"
          value={day.earnings != null ? formatMoney(day.earnings) : ''}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '')
            patchDay(date, (d) => void (d.earnings = digits ? parseInt(digits, 10) : null))
          }}
        />
        so'm
      </span>
    </label>
  )
}

function TomorrowWidget({ date, day }: WidgetProps) {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <DebouncedInput
          key={i}
          ariaLabel={`Ertangi vazifa ${i + 1}`}
          placeholder={`${i + 1}-vazifa`}
          value={day.tomorrow[i] ?? ''}
          onSave={(v) =>
            patchDay(date, (d) => {
              const arr = [...d.tomorrow]
              arr[i] = v
              d.tomorrow = arr
            })
          }
        />
      ))}
    </div>
  )
}

function TextWidget({ date, day, field, placeholder }: WidgetProps & { field: 'learned' | 'obstacle'; placeholder: string }) {
  return (
    <DebouncedInput
      multiline
      ariaLabel={placeholder}
      placeholder={placeholder}
      value={day[field]}
      onSave={(v) => patchDay(date, (d) => void (d[field] = v))}
    />
  )
}

/** Band turiga qarab qo'shimcha maydon. Oddiy bandlarda null. */
export function ItemExtra(p: WidgetProps) {
  switch (p.item.kind) {
    case 'plan': return <PlanWidget {...p} />
    case 'focus': return <FocusWidget {...p} />
    case 'book': return <BookWidget {...p} />
    case 'courier': return <CourierWidget {...p} />
    case 'tomorrow': return <TomorrowWidget {...p} />
    case 'learned': return <TextWidget {...p} field="learned" placeholder="Bugun nimani o'rgandim…" />
    case 'obstacle': return <TextWidget {...p} field="obstacle" placeholder="Nima xalaqit berdi va qanday tuzataman…" />
    default: return null
  }
}

export { toggleCheck }
