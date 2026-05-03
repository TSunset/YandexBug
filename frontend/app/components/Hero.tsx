'use client';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden border-b border-ink-600">
      {/* Декор: моноширинные текстовые "координаты" по углам */}
      <div className="absolute top-6 left-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 z-10 hidden md:block">
        N 55°45'07" / E 37°37'02"<br />
        BOOT.SEQ // INITIALIZING
      </div>
      <div className="absolute top-6 right-6 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 z-10 text-right hidden md:block">
        SECTOR.07 // GRID-A<br />
        ENV: POST-INTERNET
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Левая колонка — гигантский заголовок */}
        <div className="lg:col-span-7 relative z-10">
          <div className="section-tag mb-6">[ MISSION_BRIEF // 01 ]</div>

          <h1 className="font-display font-extrabold tracking-tightest leading-[0.85] text-[3.5rem] sm:text-[5rem] lg:text-[7.5rem]">
            <span className="block text-ink-100">Таракан</span>
            <span className="block">
              <span className="text-toxic">жив</span>
              <span className="text-ink-100">,</span>
            </span>
            <span className="block text-ink-100">даже если</span>
            <span className="block">
              <span className="text-ink-100">интернет </span>
              <span className="relative inline-block">
                <span className="text-toxic">мёртв</span>
                <span className="absolute left-0 bottom-2 w-full h-[6px] bg-toxic/40 -skew-x-12" aria-hidden />
              </span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-ink-300">
            <span className="text-toxic">{'>'}</span> YandexBug — экстренный протокол офлайн-доставки сообщений.
            Курьеры-тараканы класса Flyer работают, когда оптика срезана,
            5G заглушен, а голубиная почта потеряна на кухне.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#send" className="btn-brutal">
              Отправить сообщение
              <span aria-hidden>→</span>
            </a>
            <a href="#tariffs" className="btn-ghost">
              См. тарифы
            </a>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-px bg-ink-600 border border-ink-600 max-w-2xl">
            <Stat label="UPTIME" value="99.4%" sub="без интернета" />
            <Stat label="THREAT-AVOIDANCE" value="0.81" sub="кот / тапок / форточка" />
            <Stat label="DELIVERY-AVG" value="11min" sub="по городу" />
          </div>
        </div>

        {/* Правая колонка — таракан + терминальная панель статуса под ним */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-square max-w-[560px] mx-auto">
            {/* Подсветка-прожектор за тараканом — радиальный жёлтый свет */}
            <div
              className="absolute inset-6"
              style={{
                background: 'radial-gradient(circle at 50% 45%, rgba(236,232,26,0.35) 0%, rgba(236,232,26,0.08) 35%, transparent 65%)',
                filter: 'blur(8px)',
              }}
              aria-hidden
            />

            {/* Сканирующая сетка фоном — добавляет технологичности */}
            <div
              className="absolute inset-6 opacity-30 mix-blend-screen"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(236,232,26,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(236,232,26,0.18) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
              aria-hidden
            />

            {/* Двойная декоративная рамка — повёрнутые "технические обводки" */}
            <div className="absolute inset-0 border border-toxic/40 -rotate-2" aria-hidden />
            <div className="absolute inset-3 border border-toxic/15 rotate-1" aria-hidden />

            {/* Большие угловые маркеры */}
            <CornerMarks />

            {/* Сама фотография таракана — большая и контрастная */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cockroach.png"
              alt="Таракан-курьер"
              className="absolute inset-0 w-full h-full object-contain p-2 z-10"
              style={{
                filter:
                  'drop-shadow(0 0 80px rgba(236,232,26,0.45)) drop-shadow(0 0 12px rgba(236,232,26,0.4)) contrast(1.05) brightness(1.05)',
              }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />

            {/* Идентификатор курьера в верхнем углу */}
            <div className="absolute top-4 left-4 font-mono text-[10px] uppercase text-toxic bg-ink-900/90 px-2 py-1 border border-toxic/60 z-20 backdrop-blur-sm">
              UNIT.GENNADY // CL-FLYER
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-[10px] uppercase text-ink-300 bg-ink-900/90 px-2 py-1 border border-ink-600 z-20 backdrop-blur-sm">
              <span className="text-toxic">●</span> REC // 02:14:38
            </div>
            {/* Координатные метки сторон */}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 font-mono text-[9px] text-toxic/70 rotate-90 origin-center whitespace-nowrap">
              SECTOR.07 — A1
            </div>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 font-mono text-[9px] text-toxic/70 rotate-90 origin-center whitespace-nowrap">
              ALT 2.3M / SPEED 0.8M/S
            </div>
          </div>

          {/* Терминальная карточка статуса доставки */}
          <TerminalStatus />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-ink-850 p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">{label}</div>
      <div className="font-display font-bold text-3xl text-toxic mt-2 tabular-nums">{value}</div>
      <div className="font-mono text-[11px] text-ink-300 mt-1">{sub}</div>
    </div>
  );
}

function CornerMarks() {
  const c = 'absolute w-8 h-8 border-toxic z-20';
  return (
    <>
      <div className={`${c} top-0 left-0 border-t-[3px] border-l-[3px]`} />
      <div className={`${c} top-0 right-0 border-t-[3px] border-r-[3px]`} />
      <div className={`${c} bottom-0 left-0 border-b-[3px] border-l-[3px]`} />
      <div className={`${c} bottom-0 right-0 border-b-[3px] border-r-[3px]`} />
    </>
  );
}

function TerminalStatus() {
  return (
    <div className="mt-6 bg-ink-850 border border-ink-600 corners scanlines">
      <span className="corner-tl" />
      <span className="corner-br" />
      <div className="border-b border-ink-600 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
          <span className="w-1.5 h-1.5 bg-terminal rounded-full animate-pulse" />
          live // status.delivery
        </div>
        <span className="font-mono text-[10px] text-ink-400">DEL-100500</span>
      </div>
      <div className="p-4 font-mono text-xs space-y-1.5">
        <Line k="courier"  v="GENNADY"   color="text-toxic" />
        <Line k="class"    v="FLYER ✈"   />
        <Line k="status"   v="KITCHEN_DELAY"  color="text-danger" />
        <Line k="eta"      v="08:14"  />
        <Line k="threats"  v="cat, slipper"  color="text-ink-300" />
        <Line k="route"    v="A1 → B7 → SECTOR.07"  />
        <div className="pt-2 mt-2 border-t border-ink-600 text-ink-400">
          {'>'} log -f deliveries/DEL-100500{' '}
          <span className="text-toxic animate-cursor">_</span>
        </div>
      </div>
    </div>
  );
}

function Line({ k, v, color = 'text-ink-100' }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-ink-400">{k.padEnd(8)}</span>
      <span className={`${color} text-right`}>{v}</span>
    </div>
  );
}
