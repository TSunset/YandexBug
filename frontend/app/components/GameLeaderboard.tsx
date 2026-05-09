'use client';

import { useEffect, useState } from 'react';
import { fetchLeaderboard, type ScoreEntry } from '../lib/game';

interface Props {
  refreshTrigger?: number; // увеличиваем извне чтобы перезагрузить
  highlightUserId?: string | null;
}

export default function GameLeaderboard({ refreshTrigger = 0, highlightUserId = null }: Props) {
  const [items, setItems] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchLeaderboard(10)
      .then((d) => { if (alive) { setItems(d || []); setError(null); } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Ошибка'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshTrigger]);

  return (
    <div className="bg-ink-850 border border-ink-600 corners">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="border-b border-ink-600 px-4 py-3 flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-toxic">
          [ LEADERBOARD // TOP 10 ]
        </div>
        <span className="w-1.5 h-1.5 bg-terminal rounded-full animate-pulse" />
      </div>

      {loading && (
        <div className="font-mono text-xs text-ink-400 px-4 py-6 text-center">
          {'>'} loading…
        </div>
      )}

      {error && (
        <div className="font-mono text-xs text-danger px-4 py-6 text-center">ERR: {error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="font-mono text-xs text-ink-400 px-4 py-8 text-center">
          {'>'} пусто. будь первым.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ol className="divide-y divide-ink-600">
          {items.map((e, i) => {
            const isMe = highlightUserId && e.user_id === highlightUserId;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <li
                key={e.user_id + e.played_at}
                className={`flex items-center justify-between px-4 py-2.5 font-mono text-xs ${
                  isMe ? 'bg-toxic/10' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-ink-400 tabular-nums">
                    {medal ?? `${(i + 1).toString().padStart(2, '0')}`}
                  </span>
                  <span className="truncate text-ink-100">
                    {e.display_name || e.username}
                    {isMe && <span className="text-toxic ml-1">· you</span>}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-toxic shrink-0">
                  <span className="text-[10px] text-ink-400">L{e.level}</span>
                  <span className="font-bold tabular-nums">{e.score}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
