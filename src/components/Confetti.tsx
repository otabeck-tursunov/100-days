import { useEffect, useMemo } from 'react'

const COLORS = ['#fb923c', '#fbbf24', '#a190f7', '#5b49c4', '#34d399', '#f472b6']

export function Confetti({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3800)
    return () => clearTimeout(id)
  }, [onDone])

  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2 + Math.random() * 1.4,
        dx: (Math.random() - 0.5) * 160,
        rot: 360 + Math.random() * 540,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 6,
      })),
    [],
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      <div className="confetti">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-[2px]"
            style={
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size * 1.6,
                background: p.color,
                '--dx': `${p.dx}px`,
                '--rot': `${p.rot}deg`,
                animation: `confetti-fall ${p.dur}s ${p.delay}s ease-in forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div
        className="absolute inset-x-0 top-20 mx-auto w-fit max-w-[90%] rounded-2xl bg-surface px-5 py-3 text-center font-semibold shadow-xl"
        style={{ animation: 'banner-in .35s ease-out' }}
        role="status"
      >
        🎉 Barakalla! Bugungi navbat to'liq bajarildi
      </div>
    </div>
  )
}
