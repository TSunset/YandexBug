'use client';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-brand-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-baseline gap-1 text-2xl font-extrabold tracking-tight">
          <span className="text-red-500">Y</span>
          <span>andex</span>
          <span>Bug</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8 text-sm text-brand-gray-700">
          <a href="#how" className="hover:text-black transition">Как это работает</a>
          <a href="#tariffs" className="hover:text-black transition">Тарифы</a>
          <a href="#business" className="hover:text-black transition">Для бизнеса</a>
          <a href="#api" className="hover:text-black transition">API</a>
        </nav>

        <a
          href="#send"
          className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark transition px-4 py-2.5 rounded-xl text-black font-semibold text-sm shadow-card"
        >
          Запустить таракана
          <span aria-hidden>🪳</span>
        </a>
      </div>
    </header>
  );
}
