'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login, telegramAuth } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import TelegramLoginButton from '../components/TelegramLoginButton';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? '';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const u = await login({ username: username.trim(), password });
      setUser(u);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally { setBusy(false); }
  };

  const handleTelegramAuth = async (data: Record<string, string | number>) => {
    setError(null); setBusy(true);
    try {
      const u = await telegramAuth(data);
      setUser(u);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка Telegram авторизации');
    } finally { setBusy(false); }
  };

  return (
    <main className="max-w-md mx-auto px-6 py-20 font-mono">
      <Link href="/" className="text-[10px] uppercase tracking-[0.2em] text-ink-400 hover:text-toxic">
        ← back to mainframe
      </Link>

      <div className="section-tag mt-6 mb-4">[ AUTH // LOGIN ]</div>
      <h1 className="font-display font-extrabold tracking-tightest text-5xl mb-8 text-ink-100">
        Login_<span className="animate-cursor text-toxic">_</span>
      </h1>

      <form onSubmit={submit} className="bg-ink-850 border border-ink-600 corners p-6 space-y-5">
        <span className="corner-tl" /><span className="corner-br" />

        <Field label="username">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="current-password"
            required
          />
        </Field>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-3 py-2">ERR: {error}</div>
        )}

        <button type="submit" disabled={busy} className="w-full btn-brutal disabled:opacity-50 justify-between">
          <span>{busy ? 'AUTHENTICATING…' : 'AUTHENTICATE'}</span>
          <span aria-hidden>→</span>
        </button>

        <div className="text-xs text-ink-400 text-center pt-2 border-t border-ink-600">
          {'>'} no access?{' '}
          <Link href="/register" className="text-toxic hover:underline">create account</Link>
        </div>
      </form>

      {BOT_USERNAME && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400">or via telegram</span>
            <div className="flex-1 h-px bg-ink-600" />
          </div>
          <div className="bg-ink-850 border border-ink-600 corners p-6 flex flex-col items-center gap-3">
            <span className="corner-tl" /><span className="corner-br" />
            <div className="text-[10px] uppercase tracking-[0.2em] text-toxic mb-1">{'>'} one-click login</div>
            <TelegramLoginButton botUsername={BOT_USERNAME} onAuth={handleTelegramAuth} />
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.2em] text-toxic mb-2">{'>'} {label}</div>
      {children}
    </label>
  );
}
