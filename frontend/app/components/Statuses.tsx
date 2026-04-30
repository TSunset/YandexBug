'use client';

const items = [
  { code: 'TAKEOFF',        title: 'TAKEOFF',        desc: 'Таракан взлетел и взял курс. Удачного полёта!', color: 'bg-blue-500',    icon: '🚀' },
  { code: 'CAT_DETECTED',   title: 'CAT_DETECTED',   desc: 'Замечен кот на маршруте. Идём в обход.',         color: 'bg-orange-500',  icon: '🐱' },
  { code: 'SLIPPER_DANGER', title: 'SLIPPER_DANGER', desc: 'Обнаружена угроза тапком. Манёвр уклонения!',    color: 'bg-rose-500',    icon: '🥿' },
  { code: 'DELIVERED',      title: 'DELIVERED',      desc: 'Сообщение доставлено. Миссия выполнена!',        color: 'bg-emerald-500', icon: '✅' },
];

export default function Statuses() {
  return (
    <section id="statuses" className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">Статусы доставки</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((s, i) => (
          <div
            key={s.code}
            className={`relative bg-white border border-brand-gray-200 rounded-2xl p-5 flex items-start gap-3 hover:shadow-card transition ${i < items.length - 1 ? 'step-arrow' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full ${s.color} flex items-center justify-center text-white text-base shrink-0`}>
              <span aria-hidden>{s.icon}</span>
            </div>
            <div>
              <div className="font-bold text-sm tracking-wide">{s.title}</div>
              <div className="text-sm text-brand-gray-500 mt-0.5">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
