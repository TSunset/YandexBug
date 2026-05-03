'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInbox, markRead, type InboxMessage } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

export default function InboxPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await getInbox();
      setItems(r.messages);
      setUnread(r.unread_count);
    } catch { /* */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const onRead = async (id: string) => {
    await markRead(id);
    setItems((xs) => xs.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    setUnread((n) => Math.max(0, n - 1));
  };

  if (authLoading) {
    return <main className="max-w-3xl mx-auto px-6 py-20 font-mono text-ink-400">{'>'} loading…</main>;
  }
  if (!user) return null;

  return (
    <main className="max-w-3xl mx-auto px-6 py-16 font-mono">
      <Link href="/" className="text-[10px] uppercase tracking-[0.2em] text-ink-400 hover:text-toxic">
        ← back to mainframe
      </Link>

      <div className="section-tag mt-6 mb-4">[ INBOX // INCOMING ]</div>
      <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
        <h1 className="font-display font-extrabold tracking-tightest text-5xl text-ink-100">
          Входящие
        </h1>
        <div className="text-xs uppercase tracking-[0.2em] text-ink-400">
          unread: <span className="text-toxic font-bold">{unread.toString().padStart(3, '0')}</span>
        </div>
      </div>

      {loading && <div className="text-ink-400 text-sm">{'>'} fetching…</div>}

      {!loading && items.length === 0 && (
        <div className="border border-dashed border-ink-600 p-12 text-center">
          <div className="text-5xl text-toxic mb-3 animate-flicker">▮</div>
          <div className="text-ink-200 uppercase tracking-widest text-xs">channel idle</div>
          <div className="text-xs text-ink-400 mt-2">{'>'} ничего не прилетело. ждём таракана.</div>
        </div>
      )}

      <div className="space-y-px bg-ink-600 border border-ink-600">
        {items.map((m) => (
          <div
            key={m.id}
            className={`bg-ink-850 hover:bg-ink-700 transition p-5 ${!m.is_read ? 'border-l-2 border-l-toxic' : 'border-l-2 border-l-transparent'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">from</div>
                <div className="text-ink-100 font-bold mt-0.5">{m.sender_display}</div>
              </div>
              <div className="text-[10px] text-ink-400">
                {new Date(m.created_at).toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="text-sm text-ink-100 whitespace-pre-wrap mb-3 font-sans">{m.message}</div>
            {m.delivery_id && (
              <div className="text-[10px] text-ink-400 tracking-widest">DEL.ID: {m.delivery_id}</div>
            )}
            {!m.is_read && (
              <button
                onClick={() => onRead(m.id)}
                className="mt-3 text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border border-ink-600 hover:border-toxic hover:text-toxic transition text-ink-300"
              >
                ✓ mark as read
              </button>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
