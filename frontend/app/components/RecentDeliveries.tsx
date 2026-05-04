'use client';

import { useEffect, useState } from 'react';
import { listRecentDeliveries, type Delivery } from '../lib/api';
import { statusInfo } from '../lib/statuses';

export default function RecentDeliveries() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = () => {
      listRecentDeliveries(10)
        .then((d) => { if (alive) setItems(d || []); })
        .catch(() => { /* */ })
        .finally(() => { if (alive) setLoading(false); });
    };
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <section id="api" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="section-tag mb-4">[ FEED // 07 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl">
            Live feed
          </h2>
        </div>
        <div className="font-mono text-xs text-ink-400 max-w-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-terminal rounded-full animate-pulse" />
          tail -f /var/log/deliveries · refresh 15s
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="font-mono text-sm text-ink-400">{'>'} loading…</div>
      )}

      {!loading && items.length === 0 && (
        <div className="border border-dashed border-ink-600 p-12 text-center font-mono text-sm text-ink-400">
          {'>'} channel idle. будь первым.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-600 border border-ink-600">
        {items.map((d) => {
          const si = statusInfo(d.status);
          const statusColor = si.isFailure ? 'text-danger'
            : si.color === 'green' ? 'text-terminal'
            : si.color === 'yellow' ? 'text-toxic' : 'text-ink-200';
          return (
            <div key={d.id} className="bg-ink-850 hover:bg-ink-700 transition p-4 group">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-ink-400">{d.id}</span>
                <span className={`font-mono text-[10px] uppercase tracking-widest ${statusColor}`}>
                  {d.status}
                </span>
              </div>
              <div className="font-mono text-sm text-ink-100 line-clamp-2 mb-3 leading-snug">
                {d.message}
              </div>
              <div className="font-mono text-[10px] text-ink-400 flex items-center justify-between border-t border-ink-600 pt-2">
                <span className="truncate">→ {d.recipient_address}</span>
                <span className="text-toxic shrink-0 ml-2">{d.bug_name || ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
