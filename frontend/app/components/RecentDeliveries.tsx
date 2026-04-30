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
        .catch(() => { /* пропускаем */ })
        .finally(() => { if (alive) setLoading(false); });
    };
    load();
    const t = setInterval(load, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <section id="api" className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Последние доставки</h2>
          <p className="text-brand-gray-500 mt-2">Живой поток. Обновляется каждые 5 секунд.</p>
        </div>
      </div>

      {loading && items.length === 0 && (
        <div className="text-brand-gray-500">Загружаем...</div>
      )}

      {!loading && items.length === 0 && (
        <div className="bg-brand-gray-50 border border-dashed border-brand-gray-200 rounded-2xl p-10 text-center text-brand-gray-500">
          Пока никто ничего не отправлял. Будьте первым.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((d) => {
          const si = statusInfo(d.status);
          return (
            <div key={d.id} className="bg-white border border-brand-gray-200 rounded-xl p-4 hover:shadow-card transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-brand-gray-500">{d.id}</span>
                <span className="text-xs font-bold">{si.emoji} {d.status}</span>
              </div>
              <div className="text-sm line-clamp-2 mb-2">{d.message}</div>
              <div className="text-xs text-brand-gray-500 flex items-center justify-between">
                <span>→ {d.recipient_address}</span>
                <span>{d.bug_name ? `🪳 ${d.bug_name}` : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
