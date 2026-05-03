'use client';

import { useEffect, useState } from 'react';

const apiBase = (): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return base.replace(/\/$/, '');
};

type Props = { open: boolean; onClose: () => void };

const PRESETS = [50, 200, 1000, 5000];

export default function DonateModal({ open, onClose }: Props) {
  const [stars, setStars] = useState(200);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!open) {
      setError(null); setPaid(false); setPendingPayload(null);
    }
  }, [open]);

  useEffect(() => {
    if (!pendingPayload) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(apiBase() + `/donations/by-payload/${pendingPayload}`, {
          credentials: 'include', cache: 'no-store',
        });
        if (r.ok) {
          const d = await r.json();
          if (d.status === 'paid') { setPaid(true); setPendingPayload(null); }
        }
      } catch { /* */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingPayload]);

  if (!open) return null;

  const submit = async () => {
    setError(null); setBusy(true);
    try {
      const r = await fetch(apiBase() + '/donations/create-invoice', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars }),
      });
      const text = await r.text();
      if (!r.ok) {
        let msg = text;
        try { msg = JSON.parse(text).error || text; } catch {}
        throw new Error(msg);
      }
      const data = JSON.parse(text);
      window.open(data.invoice_url, '_blank');
      setPendingPayload(data.payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать счёт');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="bg-ink-850 border border-toxic max-w-md w-full corners relative"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 60px rgba(236,232,26,0.15)' }}
      >
        <span className="corner-tl" /><span className="corner-br" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
            <span className="w-2 h-2 bg-toxic rounded-full animate-pulse" />
            <span className="text-toxic font-bold">donate.console</span>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-toxic text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {paid ? (
            <div className="text-center py-6">
              <div className="text-7xl text-terminal mb-4 animate-flicker">✓</div>
              <div className="font-display font-extrabold text-3xl text-ink-100 mb-2">Спасибо!</div>
              <div className="text-sm text-ink-300 mb-6">
                Получено <span className="text-toxic font-bold">{stars} ★</span>. Тараканы благодарны.
              </div>
              <button onClick={onClose} className="btn-brutal">Close</button>
            </div>
          ) : (
            <>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">
                {'>'} support.amount
              </div>

              <div className="bg-ink-900 border border-ink-600 p-6 mb-5 text-center">
                <div className="font-display font-extrabold text-7xl tabular-nums text-ink-100">
                  {stars}
                  <span className="text-toxic ml-2">★</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10000}
                  value={stars}
                  onChange={(e) => setStars(parseInt(e.target.value, 10))}
                  className="w-full mt-5 accent-toxic"
                  style={{ accentColor: '#ECE81A' }}
                />
                <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-ink-400 mt-1">
                  <span>min: 1</span>
                  <span>max: 10 000</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-px bg-ink-600 border border-ink-600 mb-5">
                {PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setStars(n)}
                    className={`flex-1 px-3 py-2 text-xs uppercase tracking-wider transition
                      ${stars === n ? 'bg-toxic text-ink-900 font-bold' : 'bg-ink-850 text-ink-200 hover:bg-ink-700'}`}
                  >
                    {n} ★
                  </button>
                ))}
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger text-danger text-xs px-3 py-2 mb-3">
                  ERR: {error}
                </div>
              )}

              {pendingPayload && !paid && (
                <div className="border border-toxic/50 bg-toxic/5 text-toxic text-xs px-3 py-2 mb-3 leading-relaxed">
                  {'>'} счёт открыт в Telegram. жду подтверждения оплаты…
                  <span className="animate-cursor ml-1">_</span>
                </div>
              )}

              <button onClick={submit} disabled={busy} className="w-full btn-brutal disabled:opacity-50 justify-between">
                <span>{busy ? 'CREATING…' : `PAY ${stars} ★`}</span>
                <span aria-hidden>→</span>
              </button>

              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 mt-3 text-center">
                payment via telegram stars
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
