'use client';

export default function Business() {
  return (
    <section id="business" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="section-tag mb-4">[ ENTERPRISE // 05 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl mb-6">
            Для бизнеса
          </h2>
          <p className="font-mono text-sm text-ink-300 max-w-md mb-10 leading-relaxed">
            {'>'} YandexBug помогает компаниям оставаться на связи, когда оптика срезана,
            а резервный канал съел кот. Для офисов, складов и параноидальных команд.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 max-w-xl mb-10">
            <BizItem code="01" title="Доставка в офисы"     desc="По этажам, кабинетам, складам" />
            <BizItem code="02" title="Корпоративный кабинет" desc="Управление рассылками и правами" />
            <BizItem code="03" title="SLA и отчётность"      desc="Прозрачность через Grafana" />
            <BizItem code="04" title="Telegram-bot и API"    desc="REST + WebSocket-стрим событий" />
          </div>

          <a href="#send" className="btn-brutal">
            Получить демо <span aria-hidden>→</span>
          </a>
        </div>

        {/* Псевдо-дашборд в терминальном стиле */}
        <div className="bg-ink-850 border border-ink-600 corners overflow-hidden">
          <span className="corner-tl" />
          <span className="corner-br" />

          {/* Заголовок панели */}
          <div className="px-5 py-3 border-b border-ink-600 flex items-center justify-between bg-ink-900/50">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 bg-toxic rounded-full" />
              <span className="text-toxic font-bold">YandexBug</span>
              <span className="text-ink-400 uppercase tracking-widest">/ business.console</span>
            </div>
            <div className="font-mono text-[10px] text-ink-400">ИП Тараканов Г.Н.</div>
          </div>

          <div className="grid grid-cols-[140px_1fr]">
            <aside className="bg-ink-900/40 border-r border-ink-600 p-3 font-mono text-[11px]">
              <NavItem code="01" label="dashboard" active />
              <NavItem code="02" label="messages" />
              <NavItem code="03" label="recipients" />
              <NavItem code="04" label="couriers" />
              <NavItem code="05" label="reports" />
              <NavItem code="06" label="api.keys" />
              <NavItem code="07" label="settings" />
            </aside>

            <div className="p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">
                {'>'} dashboard / live
              </div>
              <div className="grid grid-cols-2 gap-px bg-ink-600 mb-5 border border-ink-600">
                <Stat label="MSG.SENT"    value="12 458"  />
                <Stat label="MSG.OK"      value="11 932" />
                <Stat label="SUCCESS"     value="95.8%"  highlight />
                <Stat label="AVG.TIME"    value="11 m"   />
              </div>

              <div className="border border-ink-600 p-4 bg-ink-900/40">
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">
                  <span>delivery / 7d</span>
                  <span className="text-toxic">▲ +12%</span>
                </div>
                <Sparkline />
                <div className="grid grid-cols-7 font-mono text-[9px] text-ink-400 mt-2">
                  <span>13.05</span><span>14.05</span><span>15.05</span><span>16.05</span><span>17.05</span><span>18.05</span><span>19.05</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BizItem({ code, title, desc }: { code: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="font-mono text-toxic text-xs tracking-widest pt-1 shrink-0">[{code}]</div>
      <div>
        <div className="font-display font-bold text-base text-ink-100">{title}</div>
        <div className="font-mono text-xs text-ink-300 mt-1">{desc}</div>
      </div>
    </div>
  );
}

function NavItem({ code, label, active = false }: { code: string; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 my-0.5 transition
      ${active ? 'bg-toxic text-ink-900 font-bold' : 'text-ink-300 hover:text-toxic'}`}>
      <span className="text-[9px] opacity-60">{code}</span>
      <span>{label}</span>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-ink-850 p-3">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">{label}</div>
      <div className={`font-display font-extrabold text-xl tabular-nums mt-1 ${highlight ? 'text-toxic' : 'text-ink-100'}`}>
        {value}
      </div>
    </div>
  );
}

function Sparkline() {
  const pts = [22, 14, 26, 20, 18, 30, 12];
  const W = 480, H = 110, P = 10;
  const xs = pts.map((_, i) => P + (i * (W - 2 * P)) / (pts.length - 1));
  const ys = pts.map((v) => H - P - ((H - 2 * P) * v) / 35);
  const d = pts.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  const area = `${d} L ${xs[xs.length - 1]} ${H - P} L ${xs[0]} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <path d={area} fill="rgba(236,232,26,0.10)" />
      <path d={d} stroke="#ECE81A" strokeWidth="2" fill="none" />
      {pts.map((_, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="#08080a" stroke="#ECE81A" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
