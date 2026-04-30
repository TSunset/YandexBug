'use client';

import CockroachIllustration from './CockroachIllustration';

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-6 items-center">
        <div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95]">
            Таракан жив,<br />даже если<br />интернет мертв
          </h1>

          <p className="mt-6 text-lg text-brand-gray-700 max-w-xl">
            <span className="font-semibold">YandexBug</span> — сервис офлайн-доставки сообщений по городу с помощью летающих
            тараканов во время отключений интернета.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#send"
              className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark transition px-5 py-3 rounded-xl text-black font-semibold shadow-card"
            >
              <span aria-hidden>✈️</span>
              Отправить сообщение
            </a>
            <a
              href="#tariffs"
              className="inline-flex items-center px-5 py-3 rounded-xl border border-brand-gray-300 hover:border-black transition text-black font-semibold"
            >
              Тарифы
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
            <Feature emoji="🛡️" title="Работает офлайн" subtitle="Без интернета" />
            <Feature emoji="🪳" title="100% таракан" subtitle="Никаких дронов" />
            <Feature emoji="⚡" title="Быстро и дешево" subtitle="Но не всегда" />
          </div>
        </div>

        <div className="relative">
          <div className="relative">
            <CockroachIllustration />
          </div>

          <div className="lg:absolute lg:right-0 lg:top-8 lg:translate-x-0 mt-8 lg:mt-0">
            <DeliveryStatusCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-gray-100 flex items-center justify-center text-lg shrink-0">
        {emoji}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-sm text-brand-gray-500">{subtitle}</div>
      </div>
    </div>
  );
}

function DeliveryStatusCard() {
  return (
    <div className="bg-white rounded-2xl shadow-cardHover border border-brand-gray-200 p-5 w-full max-w-[320px]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold">Статус доставки</span>
      </div>

      <div className="divide-y divide-brand-gray-100">
        <Row icon="🪳" label="Курьер" value="Геннадий" />
        <Row icon="✂️" label="Класс" value={<span>Flyer <span aria-hidden>🚀</span></span>} />
        <Row icon="🕒" label="Статус" value={<span className="text-orange-600 font-semibold">KITCHEN_DELAY</span>} />
        <Row icon="⏱️" label="ETA" value="8 минут" />
        <Row icon="⚠️" label="Угрозы" value="кот, тапок" />
      </div>

      <a
        href="#send"
        className="mt-4 w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl border border-brand-gray-200 hover:border-black text-sm font-medium transition"
      >
        Отследить в реальном времени
        <span aria-hidden>→</span>
      </a>
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-base w-5 text-center">{icon}</span>
      <span className="text-sm text-brand-gray-500 flex-1">{label}</span>
      <span className="text-sm font-semibold text-right">{value}</span>
    </div>
  );
}
