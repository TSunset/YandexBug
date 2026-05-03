'use client';

// Тараканы, ползущие по бокам экрана. Только desktop (lg+).
// Используют Cockroach-Transparent-Images.png из /public.

const BUGS = [
  { id: 1, side: 'left'  as const, sizePx: 68, duration: 26, delay:   0 },
  { id: 2, side: 'right' as const, sizePx: 56, duration: 34, delay: -13 },
  { id: 3, side: 'left'  as const, sizePx: 50, duration: 42, delay: -24 },
  { id: 4, side: 'right' as const, sizePx: 62, duration: 29, delay:  -7 },
  { id: 5, side: 'left'  as const, sizePx: 44, duration: 50, delay: -38 },
];

export default function CrawlingCockroaches() {
  return (
    <>
      <style>{`
        @keyframes ybug-up {
          0%   { transform: translateY(105vh) rotate(-90deg); }
          100% { transform: translateY(-120px) rotate(-90deg); }
        }
        @keyframes ybug-down {
          0%   { transform: translateY(-120px) rotate(90deg) scaleX(-1); }
          100% { transform: translateY(105vh)  rotate(90deg) scaleX(-1); }
        }
      `}</style>

      {BUGS.map((bug) => (
        <div
          key={bug.id}
          className="fixed top-0 z-20 pointer-events-none hidden lg:block"
          style={{
            [bug.side]: '6px',
            animation: `ybug-${bug.side === 'left' ? 'up' : 'down'} ${bug.duration}s linear ${bug.delay}s infinite`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Cockroach-Transparent-Images.png"
            alt=""
            aria-hidden
            width={bug.sizePx}
            height={bug.sizePx}
            style={{
              display: 'block',
              filter:
                'drop-shadow(0 0 8px rgba(236,232,26,0.25)) brightness(0.8) contrast(1.15)',
              opacity: 0.7,
            }}
          />
        </div>
      ))}
    </>
  );
}
