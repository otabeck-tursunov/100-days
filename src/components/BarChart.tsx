interface Bar {
  label: string
  value: number
  title?: string
}

/** Oddiy ustunli grafik (CSS). max berilmasa eng katta qiymat olinadi. */
export function BarChart({ data, max, unit = '', color = 'var(--c-morning)' }: {
  data: Bar[]
  max?: number
  unit?: string
  color?: string
}) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex h-44 items-end gap-1.5 sm:gap-2" role="img" aria-label="Grafik">
      {data.map((d, i) => (
        <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={d.title}>
          <span className="text-[10px] text-muted">{d.value ? `${Math.round(d.value)}${unit}` : ''}</span>
          <div
            className="w-full rounded-t-md transition-all"
            style={{ height: `${Math.max(2, (d.value / top) * 100) * 0.78}%`, background: color, opacity: d.value ? 1 : 0.25 }}
          />
          <span className="text-[10px] text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
