'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createDelivery, getDelivery, type Delivery } from '../lib/api';
import { statusInfo, statusProgress } from '../lib/statuses';
import { useAuth } from '../contexts/AuthContext';
import { lookupRecipient, type LookupResult } from '../lib/auth';

const TARIFF_OPTIONS = [
  { code: 'bug_free', name: 'Bug Free', price: 0 },
  { code: 'bug_plus', name: 'Bug Plus', price: 199 },
  { code: 'bug_pro', name: 'Bug Pro', price: 399 },
  { code: 'bug_business', name: 'Bug Business', price: 999 },
  { code: 'bug_ultra', name: 'Bug Ultra', price: 2999 },
];

type Props = { selectedTariff?: string };

export default function SendForm({ selectedTariff }: Props) {
  const { user } = useAuth();
  const [tariff, setTariff] = useState<string>(selectedTariff || 'bug_pro');
  const [recipient, setRecipient] = useState('');
  const [recipientInfo, setRecipientInfo] = useState<LookupResult | null>(null);
  const [recipientChecking, setRecipientChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => { if (selectedTariff) setTariff(selectedTariff); }, [selectedTariff]);

  useEffect(() => {
    const handle = recipient.trim().replace(/^@/, '');
    if (!handle) { setRecipientInfo(null); return; }
    setRecipientChecking(true);
    const t = setTimeout(async () => {
      try { setRecipientInfo(await lookupRecipient(handle)); }
      catch { setRecipientInfo(null); }
      finally { setRecipientChecking(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [recipient]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const d = await createDelivery({
        sender_name: user?.display_name,
        recipient_address: recipient.trim(),
        message: message.trim(),
        tariff,
        notify_channel: 'site',
      });
      setDelivery(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Что-то пошло не так');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDelivery(null); setRecipient(''); setMessage(''); setRecipientInfo(null);
  };

  if (!user) {
    return (
      <section id="send" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
        <div className="section-tag mb-4">[ DISPATCH // 06 ]</div>
        <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl mb-6">
          Запустить таракана
        </h2>
        <div className="bg-ink-850 border border-ink-600 corners p-12 text-center">
          <span className="corner-tl" /><span className="corner-br" />
          <div className="font-mono text-toxic text-5xl mb-3">▮ ACCESS DENIED</div>
          <div className="font-mono text-sm text-ink-300 max-w-md mx-auto mb-6">
            {'>'} требуется авторизация. чтобы получатель видел отправителя и мог ответить.
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/login" className="btn-ghost">Login</Link>
            <Link href="/register" className="btn-brutal">Sign up →</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="send" className="max-w-7xl mx-auto px-6 py-24 border-b border-ink-600">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="section-tag mb-4">[ DISPATCH // 06 ]</div>
          <h2 className="font-display font-extrabold tracking-tightest leading-[0.9] text-5xl sm:text-6xl">
            Запустить таракана
          </h2>
        </div>
        <div className="font-mono text-xs text-ink-400 max-w-sm">
          {'>'} ввод данных, симуляция полёта, real-time телеметрия статуса.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink-600 border border-ink-600">
        <form onSubmit={onSubmit} className="bg-ink-850 p-8 space-y-5">
          <Field label="recipient.handle">
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="@gennady"
              className="input"
              required
              maxLength={64}
            />
            <RecipientStatus checking={recipientChecking} info={recipientInfo} handle={recipient} />
          </Field>

          <Field label={`message.text  // ${message.length}/256`}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 256))}
              placeholder="Интернет умер, встречаемся у автомата"
              className="input min-h-[120px] resize-y"
              required
            />
          </Field>

          <Field label="tariff.class">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-ink-600 border border-ink-600">
              {TARIFF_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t.code}
                  onClick={() => setTariff(t.code)}
                  className={`p-3 transition text-left
                    ${tariff === t.code
                      ? 'bg-toxic text-ink-900'
                      : 'bg-ink-850 hover:bg-ink-700 text-ink-100'}`}
                >
                  <div className="font-mono text-[11px] font-bold uppercase">{t.name}</div>
                  <div className={`font-mono text-[10px] mt-1 ${tariff === t.code ? 'text-ink-900/80' : 'text-ink-400'}`}>
                    {t.price === 0 ? 'free' : `${t.price}₽`}
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <div className="font-mono text-xs text-ink-400 border-t border-ink-600 pt-4">
            <span className="text-toxic">{'>'}</span> sender:{' '}
            <span className="text-ink-100">{user.display_name}</span>
            <span className="text-ink-500"> @{user.username}</span>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger text-danger font-mono text-xs px-3 py-2.5">
              ERROR: {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full btn-brutal disabled:opacity-50">
            {submitting ? 'TRANSMITTING…' : 'TRANSMIT →'}
          </button>
        </form>

        <div className="bg-ink-850 p-8">
          {delivery ? <DeliveryTracker initial={delivery} onReset={reset} /> : <EmptyTracker />}
        </div>
      </div>
    </section>
  );
}

function RecipientStatus({ checking, info, handle }: { checking: boolean; info: LookupResult | null; handle: string }) {
  if (!handle.trim()) return null;
  if (checking) return <div className="font-mono text-[11px] text-ink-400 mt-2">{'>'} resolving…</div>;
  if (!info) {
    return <div className="font-mono text-[11px] text-danger mt-2">
      ERR // получатель не найден. попроси его /start у бота или зарегистрироваться.
    </div>;
  }
  if (info.kind === 'site_user') {
    return (
      <div className="font-mono text-[11px] text-terminal mt-2 flex items-center gap-2">
        <span>OK ▸ {info.display_name}</span>
        <span className="text-ink-400">@{info.handle.replace(/^@/, '')}</span>
        {info.has_telegram && <span className="text-toxic">+ TG</span>}
      </div>
    );
  }
  return (
    <div className="font-mono text-[11px] text-terminal mt-2">
      OK ▸ TG-юзер {info.handle} — придёт в Telegram
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-toxic mb-2">{'> '}{label}</div>
      {children}
    </label>
  );
}

function EmptyTracker() {
  return (
    <div className="border border-dashed border-ink-600 p-12 text-center font-mono text-xs text-ink-400 flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-5xl text-toxic mb-3 animate-flicker">▮</div>
      <div className="text-ink-200 uppercase tracking-widest">awaiting transmission</div>
      <div className="mt-2">{'>'} отправь сообщение для получения телеметрии</div>
    </div>
  );
}

function DeliveryTracker({ initial, onReset }: { initial: Delivery; onReset: () => void }) {
  const [delivery, setDelivery] = useState<Delivery>(initial);
  const [history, setHistory] = useState<string[]>([initial.status]);
  const [maxProgress, setMaxProgress] = useState<number>(statusProgress(initial.status));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDelivery(initial);
    setHistory([initial.status]);
    setMaxProgress(statusProgress(initial.status));
  }, [initial.id, initial]);

  useEffect(() => {
    const isFinal = ['DELIVERED', 'FAILED', 'EATEN', 'HERO_STATUS'].includes(delivery.status);
    if (isFinal) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(async () => {
      try {
        const fresh = await getDelivery(delivery.id);
        setDelivery((prev) => {
          if (fresh.status !== prev.status) setHistory((h) => [...h, fresh.status]);
          return fresh;
        });
        const isFinal = ['DELIVERED', 'FAILED', 'EATEN', 'HERO_STATUS'].includes(fresh.status);
        setMaxProgress((prev) => {
          const fresh_pct = statusProgress(fresh.status);
          if (isFinal) return fresh_pct;
          return Math.max(prev, fresh_pct);
        });
      } catch { /* */ }
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [delivery.id, delivery.status]);

  const info = statusInfo(delivery.status);
  const statusColor = info.isFailure ? 'text-danger'
    : info.color === 'green' ? 'text-terminal'
    : info.color === 'yellow' ? 'text-toxic' : 'text-ink-100';

  return (
    <div className="font-mono text-xs">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">delivery.id</div>
          <div className="font-bold text-lg text-ink-100 mt-1">{delivery.id}</div>
        </div>
        <span className={`px-2.5 py-1 border ${info.isFailure ? 'border-danger' : 'border-toxic'} ${statusColor} text-[10px] uppercase tracking-widest`}>
          {info.label}
        </span>
      </div>

      <FlightProgress status={delivery.status} progress={maxProgress} />
      <div className="mt-4 italic text-ink-300 min-h-[1.5em] text-[11px]">{'>'} {info.description}</div>

      <div className="grid grid-cols-2 gap-px bg-ink-600 border border-ink-600 my-5">
        <Cell label="courier" value={delivery.bug_name || '—'} />
        <Cell label="class"   value={delivery.bug_class || '—'} />
        <Cell label="tariff"  value={delivery.tariff} />
        <Cell label="eta"     value={`${delivery.eta_minutes}m`} />
      </div>

      {delivery.threats?.length > 0 && (
        <div className="border-t border-ink-600 pt-3 mb-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">threats.detected</div>
          <div className="flex flex-wrap gap-1.5">
            {delivery.threats.map((t) => (
              <span key={t} className="px-2 py-1 border border-ink-600 text-ink-200">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-ink-600 pt-3 mb-4">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">trace.log</div>
        <ol className="space-y-1.5">
          {history.map((s, i) => {
            const si = statusInfo(s);
            return (
              <li key={`${s}-${i}`} className="flex items-center gap-2">
                <span className="text-toxic">▸</span>
                <span className="text-ink-300 text-[11px] w-32">{s}</span>
                <span className="text-ink-200 text-[11px]">— {si.description}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <button onClick={onReset} className="w-full btn-ghost mt-3">
        New transmission
      </button>

      {info.isFinal && !info.isFailure && (
        <div className="mt-4 border border-terminal bg-terminal/5 p-4">
          <div className="flex items-center gap-2 text-terminal font-bold mb-3">
            <span className="text-xl">✓</span>
            <span className="uppercase tracking-widest text-[11px]">DELIVERED</span>
          </div>
          <div className="text-sans text-ink-100 bg-ink-900 p-3 border border-ink-600 whitespace-pre-wrap text-sm">
            {delivery.message}
          </div>
          <div className="text-[10px] text-terminal mt-2 italic">// таракан жив, даже если интернет мертв</div>
        </div>
      )}
      {info.isFinal && info.isFailure && (
        <div className="mt-4 border border-danger bg-danger/5 p-3 font-bold text-center text-danger uppercase tracking-widest text-[11px]">
          {info.label} // courier lost
        </div>
      )}
    </div>
  );
}

function FlightProgress({ status, progress }: { status: string; progress: number }) {
  const pct = progress;
  const isFinal = ['DELIVERED', 'FAILED', 'EATEN', 'HERO_STATUS'].includes(status);
  const isSuccess = status === 'DELIVERED';
  const isFailure = isFinal && !isSuccess;

  const barColor = isSuccess ? 'bg-terminal' : isFailure ? 'bg-danger' : 'bg-toxic';
  const traveler = isSuccess ? '✓' : isFailure ? '✕' : '🪳';
  const left = Math.min(100, Math.max(0, pct));

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">
        <span>start</span>
        <span className="text-toxic font-bold tabular-nums">{pct.toString().padStart(3, '0')}%</span>
        <span>destination</span>
      </div>
      <div className="relative h-8 bg-ink-900 border border-ink-600 overflow-visible">
        <div className={`absolute top-0 left-0 h-full ${barColor} opacity-30 transition-all duration-1000 ease-out`} style={{ width: `${left}%` }} />
        <div className={`absolute top-0 left-0 h-full ${barColor} mix-blend-screen transition-all duration-1000 ease-out`} style={{ width: `${left}%` }} />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-xl transition-all duration-1000 ease-out"
          style={{ left: `${left}%` }}
        >
          {traveler}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-850 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">{label}</div>
      <div className="font-bold text-ink-100 mt-1">{value}</div>
    </div>
  );
}
