'use client';

const steps = [
  { n: '01', code: 'ENCODE',   title: 'Пишете сообщение',    text: 'Текст до 256 символов упаковывается в капсулу-носитель класса A.' },
  { n: '02', code: 'ASSIGN',   title: 'Назначаем таракана',  title_alt: 'BIND_COURIER', text: 'Свободный курьер класса Flyer/Veteran подбирается по маршруту.' },
  { n: '03', code: 'ROUTE',    title: 'Строим маршрут',      text: 'Обход котов, тапок, мусоробок и закрытых форточек по кратчайшему пути.' },
  { n: '04', code: 'DELIVER',  title: 'Доставляем',          text: 'Таракан передаёт капсулу, отправитель получает подтверждение.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="section-tag mb-4">[ PROTOCOL // 02 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl text-ink-100">
            Как это работает
          </h2>
        </div>
        <div className="font-mono text-xs text-ink-400 max-w-sm">
          {'>'} 4 этапа от ввода текста до подтверждения доставки.
          Полная симуляция за 30–60 сек.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-ink-600">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className={`relative bg-ink-850 hover:bg-ink-700 transition-colors p-6 group
              ${i < steps.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-ink-600' : ''}
              ${i === 1 ? 'border-b lg:border-b-0' : ''}
              ${i === 2 ? 'sm:border-r-0 lg:border-r' : ''}`}
          >
            <div className="flex items-baseline justify-between mb-6">
              <div className="font-display font-extrabold text-6xl text-toxic group-hover:animate-flicker leading-none">
                {s.n}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                {s.code}
              </div>
            </div>
            <div className="font-display font-bold text-xl text-ink-100 mb-2">{s.title}</div>
            <p className="font-mono text-xs text-ink-300 leading-relaxed">{s.text}</p>
            <div className="mt-4 h-px bg-toxic/20 group-hover:bg-toxic transition-colors" />
          </div>
        ))}
      </div>
    </section>
  );
}
