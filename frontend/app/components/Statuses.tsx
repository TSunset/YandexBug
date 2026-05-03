'use client';

const items = [
  { code: 'TAKEOFF',        desc: 'Таракан взлетел и взял курс.',           color: 'text-toxic',    glyph: '↑' },
  { code: 'CAT_DETECTED',   desc: 'Замечен кот на маршруте. Идём в обход.', color: 'text-amber-300', glyph: '◉' },
  { code: 'SLIPPER_DANGER', desc: 'Угроза тапком. Манёвр уклонения!',       color: 'text-danger',   glyph: '✕' },
  { code: 'DELIVERED',      desc: 'Сообщение доставлено. Миссия выполнена.', color: 'text-terminal', glyph: '✓' },
];

export default function Statuses() {
  return (
    <section id="statuses" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="section-tag mb-4">[ TELEMETRY // 03 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl">
            Статусы доставки
          </h2>
        </div>
        <div className="font-mono text-xs text-ink-400 max-w-sm">
          {'>'} 14 возможных состояний. От взлёта до встречи с котом.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink-600 border border-ink-600">
        {items.map((s) => (
          <div key={s.code} className="bg-ink-850 hover:bg-ink-700 transition p-6 flex items-start gap-5 group">
            <div className={`font-display font-extrabold text-6xl leading-none ${s.color} group-hover:animate-flicker`}>
              {s.glyph}
            </div>
            <div className="flex-1">
              <div className={`font-mono text-sm tracking-widest font-bold ${s.color}`}>
                {s.code}
              </div>
              <div className="font-mono text-xs text-ink-300 mt-2 leading-relaxed">{s.desc}</div>
              <div className="mt-3 h-px bg-ink-600 group-hover:bg-toxic/40 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 font-mono text-[11px] text-ink-400 flex flex-wrap gap-x-6 gap-y-2">
        <span>+ 10 других: PACKED · BUG_ASSIGNED · IN_ROUTE · KITCHEN_DELAY ·
        WINDOW_BLOCKED · LOST_SIGNAL · FAILED · EATEN · HERO_STATUS · CREATED</span>
      </div>
    </section>
  );
}
