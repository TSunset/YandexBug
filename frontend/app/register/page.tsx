'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register, telegramAuth } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';
import TelegramLoginButton from '../components/TelegramLoginButton';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? '';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', display_name: '', email: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      const u = await register({
        username: form.username.trim(),
        password: form.password,
        display_name: form.display_name.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setUser(u);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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

      <div className="section-tag mt-6 mb-4">[ AUTH // REGISTER ]</div>
      <h1 className="font-display font-extrabold tracking-tightest text-5xl mb-8 text-ink-100">
        Sign_up<span className="animate-cursor text-toxic">_</span>
      </h1>

      {BOT_USERNAME && (
        <div className="mb-6">
          <div className="bg-ink-850 border border-ink-600 corners p-6 flex flex-col items-center gap-3">
            <span className="corner-tl" /><span className="corner-br" />
            <div className="text-[10px] uppercase tracking-[0.2em] text-toxic mb-1">{'>'} register via telegram</div>
            <p className="text-xs text-ink-400 text-center">Нажми кнопку — аккаунт создастся автоматически по данным из Telegram</p>
            <TelegramLoginButton botUsername={BOT_USERNAME} onAuth={handleTelegramAuth} />
          </div>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-ink-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400">or manually</span>
            <div className="flex-1 h-px bg-ink-600" />
          </div>
        </div>
      )}

      <form onSubmit={submit} className="bg-ink-850 border border-ink-600 corners p-6 space-y-5">
        <span className="corner-tl" /><span className="corner-br" />

        <Field label="username *">
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="gennady"
            className="input"
            autoComplete="username"
            required
          />
          <div className="text-[10px] text-ink-400 mt-1.5">3–32: a-z, 0-9, _</div>
        </Field>
        <Field label="password *">
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
            autoComplete="new-password"
            required
            minLength={6}
          />
        </Field>
        <Field label="display_name">
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="Геннадий"
            className="input"
            maxLength={64}
          />
        </Field>
        <Field label="email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
          />
        </Field>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger text-xs px-3 py-2">ERR: {error}</div>
        )}

        <button type="submit" disabled={busy} className="w-full btn-brutal disabled:opacity-50 justify-between">
          <span>{busy ? 'CREATING…' : 'CREATE ACCOUNT'}</span>
          <span aria-hidden>→</span>
        </button>

        <div className="text-xs text-ink-400 text-center pt-2 border-t border-ink-600">
          {'>'} already registered?{' '}
          <Link href="/login" className="text-toxic hover:underline">login</Link>
        </div>
      </form>
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
