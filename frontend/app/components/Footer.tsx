'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-8">
        <Col title="О продукте" items={['Как это работает', 'Статусы доставки', 'Технологии', 'Безопасность']} />
        <Col title="Тарифы и оплата" items={['Тарифы', 'Способы оплаты', 'Возврат средств']} />
        <Col title="Разработчикам" items={['API', 'Документация', 'Примеры кода']} />
        <Col title="Компания" items={['О нас', 'Вакансии', 'Контакты']} />

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex lg:flex-col items-start lg:items-end gap-4">
          <div className="flex items-center gap-3 text-sm text-brand-gray-700">
            <span aria-hidden className="text-2xl">🪳</span>
            <p>
              Сделано с усами и без логики.<br />
              Абсурдный стартап-концепт.<br />
              Не пытайтесь повторить это дома.
            </p>
          </div>
          <div className="flex items-center gap-3 text-brand-gray-500">
            <span aria-hidden>✈️</span>
            <span aria-hidden>🌐</span>
            <span aria-hidden>❄️</span>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-brand-gray-500 flex justify-between">
          <span>© 2026 YandexBug</span>
          <span>Абсурдный стартап-концепт. MVP.</span>
        </div>
      </div>
    </footer>
  );
}

function Col({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="font-semibold text-sm mb-3">{title}</div>
      <ul className="space-y-2 text-sm text-brand-gray-500">
        {items.map((i) => <li key={i}><a href="#" className="hover:text-black transition">{i}</a></li>)}
      </ul>
    </div>
  );
}
