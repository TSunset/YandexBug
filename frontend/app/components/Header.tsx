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
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, []);

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 bg-ink-900/85 backdrop-blur-md border-b border-ink-600">
      {/* Статус-полоска */}
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

        {/* Desktop nav */}
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

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right font-mono text-xs">
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
            <div className="flex items-center gap-2">
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
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider px-3 py-2 border border-toxic text-toxic hover:bg-toxic hover:text-ink-900 transition"
            title="Поддержать звёздами"
          >
            <span aria-hidden>★</span>
            <span>Donate</span>
          </button>

          <a
            href="/#send"
            className="inline-flex btn-brutal"
            style={{ boxShadow: '4px 4px 0 0 #1f1f26' }}
          >
            Запустить таракана
            <span aria-hidden>↗</span>
          </a>
        </div>

        {/* Mobile: user badge + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          {user && (
            <div className="font-mono text-xs text-ink-400">@{user.username}</div>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="font-mono text-xl leading-none text-ink-300 hover:text-toxic transition w-10 h-10 flex items-center justify-center border border-ink-600 hover:border-toxic"
            aria-label="Меню"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-ink-600 bg-ink-900">
          <nav className="flex flex-col font-mono text-xs uppercase tracking-[0.18em] text-ink-300 px-6 py-4 gap-4">
            <a href="/#how" onClick={close} className="hover:text-toxic transition">[01] Protocol</a>
            <a href="/#tariffs" onClick={close} className="hover:text-toxic transition">[02] Tariffs</a>
            <a href="/#business" onClick={close} className="hover:text-toxic transition">[03] B2B</a>
            {user && (
              <Link href="/inbox" onClick={close} className="relative hover:text-toxic transition flex items-center gap-2">
                [04] Inbox
                {unread > 0 && (
                  <span className="bg-toxic text-ink-900 text-[10px] font-bold min-w-[18px] h-[18px] inline-flex items-center justify-center px-1">
                    {unread}
                  </span>
                )}
              </Link>
            )}
          </nav>

          <div className="border-t border-ink-600 px-6 py-4 flex flex-col gap-3">
            <a
              href="/#send"
              onClick={close}
              className="btn-brutal w-full justify-between"
            >
              <span>Запустить таракана</span>
              <span aria-hidden>↗</span>
            </a>

            <button
              onClick={() => { setDonateOpen(true); close(); }}
              className="w-full flex items-center justify-between font-mono text-xs uppercase tracking-wider px-3 py-2 border border-toxic text-toxic hover:bg-toxic hover:text-ink-900 transition"
            >
              <span>★ Donate</span>
              <span aria-hidden>→</span>
            </button>

            {user ? (
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs">
                  <div className="text-ink-100">{user.display_name}</div>
                  <div className="text-ink-400">@{user.username}</div>
                </div>
                <button
                  onClick={() => { logout(); close(); }}
                  className="font-mono text-xs uppercase tracking-wider px-3 py-2 border border-ink-600 hover:border-toxic hover:text-toxic transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={close}
                  className="flex-1 font-mono text-xs uppercase tracking-wider px-3 py-2 border border-ink-600 hover:border-toxic hover:text-toxic transition text-center"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={close}
                  className="flex-1 font-mono text-xs uppercase tracking-wider px-3 py-2 bg-ink-100 text-ink-900 hover:bg-toxic transition text-center"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} />
    </header>
  );
}
