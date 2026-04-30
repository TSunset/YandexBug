'use client';

import { useEffect, useState } from 'react';
import { listTariffs, type Tariff } from '../lib/api';

const BUG_COLOR: Record<string, string> = {
  bug_free: 'from-amber-200 to-amber-50',
  bug_plus: 'from-yellow-200 to-yellow-50',
  bug_pro: 'from-orange-200 to-orange-50',
  bug_business: 'from-stone-200 to-stone-50',
  bug_ultra: 'from-pink-200 to-pink-50',
};

const fallbackTariffs: Tariff[] = [
  { code: 'bug_free',     name: 'Bug Free',     price: 0,    description: 'Для тех, кому не горит',
    features: ['Доставка в пределах подъезда', 'Без приоритета', 'Возможна задержка'], success_rate: 0.45, is_popular: false },
  { code: 'bug_plus',     name: 'Bug Plus',     price: 199,  description: 'Быстрее, но не сильно',
    features: ['Доставка по району', 'Приоритетный вылет', 'Статус в реальном времени'], success_rate: 0.65, is_popular: false },
  { code: 'bug_pro',      name: 'Bug Pro',      price: 399,  description: 'Когда сообщение важно',
    features: ['Доставка по городу', 'Обход угроз', 'Фото-подтверждение'], success_rate: 0.80, is_popular: true },
  { code: 'bug_business', name: 'Bug Business', price: 999,  description: 'Для офиса и команды',
    features: ['Корпоративный кабинет', 'SLA 99% — ну почти', 'Интеграция и отчёты'], success_rate: 0.85, is_popular: false },
  { code: 'bug_ultra',    name: 'Bug Ultra',    price: 2999, description: 'Для параноиков и срочных',
    features: ['Мгновенный вылет', 'Личный таракан-курьер', 'Доставка за 5 минут*'], success_rate: 0.95, is_popular: false },
];

export default function Tariffs({ onChoose }: { onChoose?: (code: string) => void }) {
  const [tariffs, setTariffs] = useState<Tariff[]>(fallbackTariffs);

  useEffect(() => {
    listTariffs()
      .then((t) => { if (t && t.length) setTariffs(t); })
      .catch(() => { /* остаёмся на fallback */ });
  }, []);

  return (
    <section id="tariffs" className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">Тарифы</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tariffs.map((t) => (
          <div
            key={t.code}
            className={`relative bg-white rounded-2xl border p-5 flex flex-col transition
              ${t.is_popular ? 'border-brand-yellow shadow-popular' : 'border-brand-gray-200 hover:shadow-card'}`}
          >
            {t.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-yellow text-black text-xs font-bold px-3 py-1 rounded-full shadow-card whitespace-nowrap">
                Популярный
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="text-xl font-extrabold tracking-tight">{t.name}</div>
              {t.code === 'bug_plus' && <span aria-hidden>⭐</span>}
            </div>
            <div className="text-sm text-brand-gray-500 mt-1">{t.description}</div>

            <div className={`my-5 h-24 rounded-xl bg-gradient-to-br ${BUG_COLOR[t.code] || 'from-brand-gray-100 to-white'} flex items-center justify-center text-5xl`}>
              <span aria-hidden>🪳</span>
            </div>

            <ul className="text-sm space-y-1.5 text-brand-gray-700 mb-5">
              {t.features.map((f, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand-gray-300">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="text-2xl font-extrabold mt-auto">
              {t.price === 0 ? '0 ₽' : `${t.price} ₽`}
            </div>

            <button
              onClick={() => onChoose?.(t.code)}
              className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition
                ${t.price === 0
                  ? 'border border-brand-gray-300 hover:border-black text-black'
                  : 'bg-brand-yellow hover:bg-brand-yellowDark text-black'}`}
            >
              {t.price === 0 ? 'Попробовать бесплатно' : 'Выбрать тариф'}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-brand-gray-500 mt-4">* Если все коты спят и тапки на месте.</p>
    </section>
  );
}
