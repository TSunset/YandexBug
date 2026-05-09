'use client';

import Link from 'next/link';
import { useState } from 'react';
import GameCanvas from '../components/GameCanvas';
import GameLeaderboard from '../components/GameLeaderboard';
import { useAuth } from '../contexts/AuthContext';

export default function GamePage() {
  const { user } = useAuth();
  const [refreshTick, setRefreshTick] = useState(0);

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 font-mono">
      <Link
        href="/"
        className="text-[10px] uppercase tracking-[0.2em] text-ink-400 hover:text-toxic"
      >
        ← back to mainframe
      </Link>

      <div className="section-tag mt-6 mb-3">[ GAME // BUG_RUNNER ]</div>
      <h1 className="font-display font-extrabold tracking-tightest text-5xl sm:text-6xl mb-3 text-ink-100">
        Bug<span className="text-toxic">_</span>Runner
      </h1>
      <p className="text-sm text-ink-300 max-w-2xl mb-10 leading-relaxed">
        Управляй тараканом по лабиринту города. Собирай{' '}
        <span className="text-toxic">крошки</span> и{' '}
        <span className="text-toxic">письма</span>, относи их в почтовый ящик{' '}
        📬 за бонус. Убегай от <span className="text-danger">котов</span> и
        смотри под лапы — иногда падают <span className="text-danger">тапки</span>.
        За секунду до удара появится красный маркер.
      </p>

      {!user && (
        <div className="bg-danger/10 border border-danger px-4 py-3 mb-6 text-xs text-danger flex items-center justify-between flex-wrap gap-3">
          <span>{'>'} играть можно, но рекорд в лидерборд попадёт только если ты залогинен</span>
          <div className="flex gap-2">
            <Link href="/login" className="underline hover:text-toxic">login</Link>
            <span>/</span>
            <Link href="/register" className="underline hover:text-toxic">sign up</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Игровое поле */}
        <div className="lg:col-span-8">
          <GameCanvas
            loggedIn={!!user}
            onScoreSaved={() => setRefreshTick((t) => t + 1)}
          />

          {/* Подсказки */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] uppercase tracking-[0.18em] text-ink-400">
            <Hint k="W A S D / ↑←↓→" v="движение" />
            <Hint k="✉ +50" v="письмо" />
            <Hint k="📬 +200×N" v="доставка" />
            <Hint k="·  +10" v="крошка" />
          </div>
        </div>

        {/* Сайдбар: лидерборд */}
        <aside className="lg:col-span-4 space-y-6">
          <GameLeaderboard
            refreshTrigger={refreshTick}
            highlightUserId={user?.id ?? null}
          />

          <div className="bg-ink-850 border border-ink-600 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-toxic mb-3">
              [ RULES // ПРАВИЛА ]
            </div>
            <ul className="text-xs text-ink-300 space-y-1.5 leading-relaxed">
              <li>{'>'} 3 жизни — теряются от котов и тапок</li>
              <li>{'>'} смерть — очки уровня сбрасываются</li>
              <li>{'>'} крошка <span className="text-toxic">10</span>, письмо{' '}
                <span className="text-toxic">50</span>, доставка{' '}
                <span className="text-toxic">200</span> за каждое</li>
              <li>{'>'} все 3 письма за раз → бонус{' '}
                <span className="text-toxic">+500</span></li>
              <li>{'>'} собери все крошки → переход на уровень и{' '}
                <span className="text-toxic">+1000</span></li>
              <li>{'>'} коты быстрее с каждым уровнем</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Hint({ k, v }: { k: string; v: string }) {
  return (
    <div className="border border-ink-600 px-3 py-2 bg-ink-850">
      <div className="text-toxic font-bold">{k}</div>
      <div className="text-ink-400 mt-0.5">{v}</div>
    </div>
  );
}
