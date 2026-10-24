import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  inputMode?: 'text' | 'numeric'
  ariaLabel?: string
}

/** Yozishda mahalliy holat; 500ms to'xtagach yoki fokus yo'qolganda saqlaydi. */
export function DebouncedInput({ value, onSave, placeholder, multiline, rows = 2, inputMode, ariaLabel }: Props) {
  const [v, setV] = useState(value)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef<string | null>(null)
  const save = useRef(onSave)
  save.current = onSave

  useEffect(() => {
    if (document.activeElement !== ref.current) setV(value)
  }, [value])

  const flush = () => {
    window.clearTimeout(timer.current)
    if (pending.current !== null) {
      save.current(pending.current)
      pending.current = null
    }
  }
  useEffect(() => flush, [])

  const change = (next: string) => {
    setV(next)
    pending.current = next
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, 500)
  }

  const common = {
    ref,
    value: v,
    placeholder,
    'aria-label': ariaLabel,
    className: 'input',
    onBlur: flush,
  }
  return multiline ? (
    <textarea {...common} rows={rows} onChange={(e) => change(e.target.value)} className="input resize-y" />
  ) : (
    <input {...common} inputMode={inputMode} onChange={(e) => change(e.target.value)} />
  )
}
