'use client';

const steps = [
  { n: 1, icon: '✏️', title: 'Пишете сообщение', text: 'Мы упакуем его в капсулу и подготовим к полёту.' },
  { n: 2, icon: '🪳', title: 'Назначаем таракана', text: 'Выбираем свободного курьера с нужными навыками.' },
  { n: 3, icon: '📍', title: 'Строим маршрут', text: 'Обходим угрозы: котов, тапки и мусоробки.' },
  { n: 4, icon: '🏠', title: 'Доставляем адресату', text: 'Таракан передаёт капсулу, вы получаете подтверждение.' },
];

export default function HowItWorks() {
  return (
    <section id="how" className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">Как это работает</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div
            key={s.n}
            className={`relative bg-white border border-brand-gray-200 rounded-2xl p-5 hover:shadow-card transition ${i < steps.length - 1 ? 'step-arrow' : ''}`}
          >
            <div className="w-12 h-12 rounded-full bg-brand-yellow flex items-center justify-center text-xl mb-4">
              {s.icon}
            </div>
            <div className="font-semibold mb-1">{s.n}. {s.title}</div>
            <p className="text-sm text-brand-gray-500">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
