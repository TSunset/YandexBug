'use client';

const steps = [
  { n: '01', code: 'ENCODE',   title: 'Пишете сообщение',    text: 'Текст до 256 символов упаковывается в капсулу-носитель класса A.' },
  { n: '02', code: 'ASSIGN',   title: 'Назначаем таракана',  text: 'Свободный курьер класса Flyer/Veteran подбирается по маршруту.' },
  { n: '03', code: 'ROUTE',    title: 'Строим маршрут',      text: 'Обход котов, тапок, мусоробок и закрытых форточек по кратчайшему пути.' },
  { n: '04', code: 'DELIVER',  title: 'Доставляем',          text: 'Таракан передаёт капсулу, отправитель получает подтверждение.' },
];

const channels = [
  {
    icon: '🤖',
    code: 'TG → TG',
    title: 'Telegram ↔ Telegram',
    text: 'Оба пользователя запустили бота. Отправитель использует /send и указывает @username получателя. Сообщение придёт прямо в Telegram с анимацией полёта таракана.',
    hint: 'Получатель должен запустить /start хотя бы раз',
  },
  {
    icon: '🌐',
    code: 'SITE → SITE',
    title: 'Сайт ↔ Сайт',
    text: 'Оба зарегистрированы на сайте. Отправьте сообщение через форму, указав username получателя. Сообщение появится у него во вкладке Inbox.',
    hint: 'Для получения нужен аккаунт на сайте',
  },
  {
    icon: '🔀',
    code: 'SITE → TG',
    title: 'Сайт → Telegram',
    text: 'Зарегистрированный на сайте может отправить сообщение пользователю Telegram. Достаточно указать его @username — таракан найдёт его и доставит уведомление прямо в Telegram.',
    hint: 'Получатель должен запустить бота',
  },
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

      {/* 4 шага доставки */}
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

      {/* Каналы связи */}
      <div className="mt-20">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="section-tag mb-4">[ CHANNELS // ПРОТОКОЛЫ СВЯЗИ ]</div>
            <h3 className="font-display font-extrabold tracking-tightest leading-[0.9] text-3xl sm:text-4xl text-ink-100">
              Кто с кем может общаться
            </h3>
          </div>
          <div className="font-mono text-xs text-ink-400 max-w-sm">
            {'>'} три канала передачи: Telegram, сайт, и кросс-платформа.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 border border-ink-600">
          {channels.map((ch, i) => (
            <div
              key={ch.code}
              className={`bg-ink-850 hover:bg-ink-700 transition-colors p-6 group
                ${i < channels.length - 1 ? 'border-b sm:border-b-0 sm:border-r border-ink-600' : ''}`}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="text-3xl">{ch.icon}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-toxic">{ch.code}</span>
              </div>
              <div className="font-display font-bold text-lg text-ink-100 mb-3">{ch.title}</div>
              <p className="font-mono text-xs text-ink-300 leading-relaxed mb-4">{ch.text}</p>
              <div className="font-mono text-[10px] text-ink-400 border-t border-ink-600 pt-3 flex items-start gap-1.5">
                <span className="text-toxic shrink-0">{'>'}</span>
                <span>{ch.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
