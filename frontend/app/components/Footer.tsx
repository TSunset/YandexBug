'use client';

import { useState } from 'react';
import DonateModal from './DonateModal';

export default function Footer() {
  const [donateOpen, setDonateOpen] = useState(false);

  return (
    <footer className="bg-ink-900 border-t border-ink-600 mt-24">
      {/* Большая верхняя полоса с пунктирами и манифестом */}
      <div className="border-b border-ink-600">
        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <div className="lg:col-span-8">
            <div className="section-tag mb-5">[ END_OF_TRANSMISSION ]</div>
            <h3 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl lg:text-7xl text-ink-100">
              Таракан жив.<br />
              <span className="text-toxic">Сигнал — нет.</span>
            </h3>
            <p className="font-mono text-sm text-ink-300 mt-6 max-w-lg">
              {'>'} абсурдный стартап-концепт // учебный MVP // не пытайтесь повторить дома
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <button
              onClick={() => setDonateOpen(true)}
              className="btn-brutal w-full justify-between"
            >
              <span>★ Поддержать звёздами</span>
              <span aria-hidden>→</span>
            </button>
            <a href="#send" className="btn-ghost w-full justify-between">
              <span>Запустить таракана</span>
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Колонки ссылок */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <Col title="Protocol" items={['Как это работает', 'Статусы доставки', 'Технологии', 'Безопасность']} />
        <Col title="Pricing"  items={['Тарифы', 'Способы оплаты', 'Возврат средств']} />
        <Col title="Devs"     items={['API', 'Документация', 'Примеры кода']} />
        <Col title="Company"  items={['О нас', 'Вакансии', 'Контакты']} />
      </div>

      {/* Посвящение Варе — большое фото и подпись */}
      <div className="border-t border-ink-600 bg-gradient-to-b from-ink-900 to-ink-850">
        <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center gap-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-toxic">
            ───── DEDICATION ─────
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/varya.jpg"
              alt="Варя"
              className="w-72 h-72 sm:w-96 sm:h-96 object-cover border-4 border-toxic shadow-glowSoft"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Угловые маркеры */}
            <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-toxic" />
            <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-toxic" />
            <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-toxic" />
            <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-toxic" />
          </div>
          <div className="text-center">
            <div className="font-display font-extrabold text-3xl sm:text-4xl tracking-tightest text-ink-100">
              Сделано для особенного человека{' '}
              <span className="text-danger">❤</span>
            </div>
            <div className="font-mono text-sm text-toxic mt-3 tracking-widest uppercase">— Варя —</div>
          </div>
        </div>
      </div>

      {/* Нижняя строка */}
      <div className="border-t border-ink-600">
        <div className="max-w-7xl mx-auto px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 flex flex-wrap justify-between gap-2">
          <span>© 2026 YandexBug // OFFLINE-MAIL.PROTOCOL</span>
          <span>BUILD: 0.1.4 · NODE: SECTOR-07 · STATUS: <span className="text-terminal">OK</span></span>
        </div>
      </div>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </footer>
  );
}

function Col({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-toxic mb-4">
        // {title}
      </div>
      <ul className="space-y-2.5 font-mono text-sm text-ink-300">
        {items.map((i) => (
          <li key={i}>
            <a href="#" className="hover:text-toxic transition flex items-center gap-2">
              <span className="opacity-50">▸</span>{i}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
