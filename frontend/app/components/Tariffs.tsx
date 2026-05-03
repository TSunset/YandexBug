'use client';

import { useEffect, useState } from 'react';
import { listTariffs, type Tariff } from '../lib/api';

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

const TARIFF_CODE: Record<string, string> = {
  bug_free:     'BFR-00',
  bug_plus:     'BPL-01',
  bug_pro:      'BPR-02',
  bug_business: 'BBZ-03',
  bug_ultra:    'BUL-04',
};

export default function Tariffs({ onChoose }: { onChoose?: (code: string) => void }) {
  const [tariffs, setTariffs] = useState<Tariff[]>(fallbackTariffs);

  useEffect(() => {
    listTariffs()
      .then((t) => { if (t && t.length) setTariffs(t); })
      .catch(() => { /* остаёмся на fallback */ });
  }, []);

  return (
    <section id="tariffs" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="section-tag mb-4">[ PRICING // 04 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl">
            Тарифы
          </h2>
        </div>
        <div className="font-mono text-xs text-ink-400 max-w-sm">
          {'>'} Тариф влияет на класс таракана и ETA.
          Шанс доставки одинаковый — 70% (30% courier-loss).
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-ink-600 border border-ink-600">
        {tariffs.map((t) => {
          const isPop = t.is_popular;
          return (
            <div
              key={t.code}
              className={`relative bg-ink-850 hover:bg-ink-700 transition-colors p-6 flex flex-col group
                ${isPop ? 'lg:scale-y-[1.04] lg:-mt-2 lg:-mb-2 z-10' : ''}`}
            >
              {isPop && (
                <div className="absolute -top-px left-0 right-0 bg-toxic text-ink-900 font-mono text-[10px] uppercase tracking-[0.2em] text-center py-1">
                  ★ POPULAR
                </div>
              )}

              <div className={`flex items-baseline justify-between ${isPop ? 'mt-4' : ''}`}>
                <div className="font-display font-extrabold text-2xl text-ink-100">
                  {t.name}
                </div>
                <div className="font-mono text-[10px] text-ink-400 tracking-wider">
                  {TARIFF_CODE[t.code] ?? t.code}
                </div>
              </div>

              <div className="font-mono text-xs text-ink-300 mt-2 mb-6 min-h-[2.5em]">
                {t.description}
              </div>

              <ul className="font-mono text-xs space-y-2 text-ink-200 mb-8 flex-1">
                {t.features.map((f, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-toxic shrink-0">▸</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-ink-600 pt-4 mb-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                  PRICE
                </div>
                <div className="font-display font-extrabold text-4xl tabular-nums mt-1">
                  <span className={isPop ? 'text-toxic' : 'text-ink-100'}>
                    {t.price === 0 ? '0' : t.price}
                  </span>
                  <span className="text-base text-ink-400 font-mono ml-1">₽</span>
                </div>
              </div>

              <button
                onClick={() => onChoose?.(t.code)}
                className={`w-full py-3 font-mono text-xs uppercase tracking-wider font-bold transition border-2
                  ${isPop
                    ? 'bg-toxic text-ink-900 border-toxic hover:bg-ink-900 hover:text-toxic'
                    : 'bg-transparent text-ink-100 border-ink-600 hover:border-toxic hover:text-toxic'}`}
              >
                {t.price === 0 ? 'Try free' : 'Select'} →
              </button>
            </div>
          );
        })}
      </div>

      <p className="font-mono text-[11px] text-ink-400 mt-4 italic">
        * Если все коты спят и тапки на месте.
      </p>
    </section>
  );
}
