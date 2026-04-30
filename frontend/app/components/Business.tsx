'use client';

export default function Business() {
  return (
    <section id="business" className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Для бизнеса</h2>
          <p className="text-brand-gray-700 max-w-md mb-8">
            YandexBug помогает компаниям оставаться на связи, когда всё остальное не работает.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 max-w-xl">
            <BizItem icon="🌐" title="Доставка в офисы"     desc="По этажам, кабинетам и складам" />
            <BizItem icon="🖥️" title="Корпоративный кабинет" desc="Управление рассылками и правами" />
            <BizItem icon="📊" title="SLA и отчётность"      desc="Прозрачность и надёжность" />
            <BizItem icon="✈️" title="Telegram-бот и API"    desc="Автоматизация без боли" />
          </div>

          <a
            href="#send"
            className="mt-8 inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark transition px-5 py-3 rounded-xl text-black font-semibold shadow-card"
          >
            Подробнее для бизнеса <span aria-hidden>→</span>
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-brand-gray-200 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-gray-100 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold tracking-tight"><span className="text-red-500">Y</span>andexBug</span>
              <span className="text-xs uppercase tracking-wider text-brand-gray-500">Business</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-brand-gray-500">
              <span aria-hidden>👤</span>
              <span>ИП Тараканов Г.Н. ▾</span>
            </div>
          </div>

          <div className="grid grid-cols-[180px_1fr]">
            <aside className="bg-brand-gray-50 p-3 text-sm">
              <NavItem icon="🏠" label="Дашборд" active />
              <NavItem icon="✉️" label="Сообщения" />
              <NavItem icon="📍" label="Адресаты" />
              <NavItem icon="🪳" label="Тараканы" />
              <NavItem icon="📊" label="Отчёты" />
              <NavItem icon="🔌" label="Интеграции" />
              <NavItem icon="⚙️" label="Настройки" />
            </aside>

            <div className="p-5">
              <div className="text-lg font-bold mb-4">Дашборд</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Stat label="Сообщений отправлено" value="12 458" />
                <Stat label="Доставлено" value="11 932" />
                <Stat label="Успешность" value="95.8%" />
                <Stat label="Среднее время" value="11 мин" />
              </div>

              <div className="border border-brand-gray-100 rounded-xl p-4">
                <div className="text-sm font-semibold mb-3">Доставка за 7 дней</div>
                <Sparkline />
                <div className="grid grid-cols-7 text-[10px] text-brand-gray-500 mt-1">
                  <span>13 мая</span><span>14 мая</span><span>15 мая</span><span>16 мая</span><span>17 мая</span><span>18 мая</span><span>19 мая</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BizItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-brand-gray-100 flex items-center justify-center text-base shrink-0">
        <span aria-hidden>{icon}</span>
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm text-brand-gray-500">{desc}</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg my-0.5 ${active ? 'bg-brand-yellow text-black font-semibold' : 'text-brand-gray-700 hover:bg-white'}`}>
      <span aria-hidden>{icon}</span><span>{label}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-brand-gray-100 rounded-xl p-3">
      <div className="text-xs text-brand-gray-500 mb-1">{label}</div>
      <div className="text-lg font-extrabold">{value}</div>
    </div>
  );
}

function Sparkline() {
  const pts = [22, 14, 26, 20, 18, 30, 12];
  const W = 480, H = 110, P = 10;
  const xs = pts.map((_, i) => P + (i * (W - 2 * P)) / (pts.length - 1));
  const ys = pts.map((v) => P + ((H - 2 * P) * v) / 35);
  const d = pts.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" preserveAspectRatio="none">
      <path d={d} stroke="#FFCE2E" strokeWidth="2.5" fill="none" />
      {pts.map((_, i) => (
        <circle key={i} cx={xs[i]} cy={ys[i]} r="3.5" fill="#FFCE2E" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}
