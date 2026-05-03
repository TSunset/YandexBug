'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUnreadCount } from '../lib/auth';
import DonateModal from './DonateModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let stop = false;
    const tick = async () => {
      const n = await getUnreadCount().catch(() => 0);
      if (!stop) setUnread(n);
    };
    tick();
    const interval = setInterval(tick, 8000);
    return () => {
      stop = true;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-30 bg-ink-900/85 backdrop-blur-md border-b border-ink-600">
      {/* Тонкая моно-полоска статуса под шапкой */}
      <div className="bg-toxic text-ink-900 font-mono text-[11px] uppercase tracking-[0.2em] py-1.5 px-6 flex justify-between items-center">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-ink-900 rounded-full animate-pulse" />
          OFFLINE.MAIL.PROTOCOL // v0.1.4 — STATUS: OPERATIONAL
        </span>
        <span className="hidden md:inline">UPTIME: 99.4% · SLIPPER-INDEX: LOW</span>
      </div>

      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-2 font-display font-extrabold text-2xl tracking-tightest">
          <span className="inline-block w-2.5 h-2.5 bg-toxic shadow-glow group-hover:animate-flicker" />
          <span className="text-toxic">Yandex</span>
          <span className="text-ink-100">Bug</span>
          <span className="text-toxic font-mono text-base font-normal animate-cursor">_</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] text-ink-300">
          <a href="/#how" className="hover:text-toxic transition">[01] Protocol</a>
          <a href="/#tariffs" className="hover:text-toxic transition">[02] Tariffs</a>
          <a href="/#business" className="hover:text-toxic transition">[03] B2B</a>
          {user && (
            <Link href="/inbox" className="relative hover:text-toxic transition">
              [04] Inbox
              {unread > 0 && (
                <span className="absolute -top-2 -right-5 bg-toxic text-ink-900 text-[10px] font-bold rounded-none min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
                  {unread}
                </span>
              )}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right font-mono text-xs">
                <div className="text-ink-100 leading-tight">{user.display_name}</div>
                <div className="text-ink-400">@{user.username}</div>
              </div>
              <button
                onClick={() => logout()}
                className="font-mono text-xs uppercase tracking-wider px-3 py-2 border border-ink-600 hover:border-toxic hover:text-toxic transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/login"
                className="font-mono text-xs uppercase tracking-wider px-3 py-2 border border-ink-600 hover:border-toxic hover:text-toxic transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="font-mono text-xs uppercase tracking-wider px-3 py-2 bg-ink-100 text-ink-900 hover:bg-toxic transition"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            onClick={() => setDonateOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-2 border border-toxic text-toxic hover:bg-toxic hover:text-ink-900 transition"
            title="Поддержать звёздами"
          >
            <span aria-hidden>★</span>
            <span>Donate</span>
          </button>

          <a
            href="/#send"
            className="hidden md:inline-flex btn-brutal"
            style={{ boxShadow: '4px 4px 0 0 #1f1f26' }}
          >
            Запустить таракана
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </header>
  );
}
