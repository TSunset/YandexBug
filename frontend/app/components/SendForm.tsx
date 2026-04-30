'use client';

import { useEffect, useRef, useState } from 'react';
import { createDelivery, getDelivery, type Delivery } from '../lib/api';
import { statusInfo } from '../lib/statuses';

const TARIFF_OPTIONS = [
  { code: 'bug_free', name: 'Bug Free', price: 0 },
  { code: 'bug_plus', name: 'Bug Plus', price: 199 },
  { code: 'bug_pro', name: 'Bug Pro', price: 399 },
  { code: 'bug_business', name: 'Bug Business', price: 999 },
  { code: 'bug_ultra', name: 'Bug Ultra', price: 2999 },
];

type Props = {
  selectedTariff?: string;
};

export default function SendForm({ selectedTariff }: Props) {
  const [tariff, setTariff] = useState<string>(selectedTariff || 'bug_pro');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    if (selectedTariff) setTariff(selectedTariff);
  }, [selectedTariff]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const d = await createDelivery({
        sender_name: sender.trim() || undefined,
        recipient_address: recipient.trim(),
        message: message.trim(),
        tariff,
        notify_channel: 'site',
      });
      setDelivery(d);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Что-то пошло не так';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDelivery(null);
    setRecipient('');
    setMessage('');
  };

  return (
    <section id="send" className="max-w-7xl mx-auto px-6 py-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Отправить сообщение</h2>
      <p className="text-brand-gray-500 mb-6">Заполните форму — мы назначим таракана и покажем статус в реальном времени.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl border border-brand-gray-200 p-6 shadow-card space-y-4"
        >
          <Field label="Куда / адрес доставки" required>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Например: Комната 514"
              className="input"
              required
              maxLength={200}
            />
          </Field>

          <Field label={`Сообщение (${message.length}/256)`} required>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 256))}
              placeholder="Интернет умер, встречаемся у автомата"
              className="input min-h-[100px] resize-y"
              required
            />
          </Field>

          <Field label="Тариф" required>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TARIFF_OPTIONS.map((t) => (
                <button
                  type="button"
                  key={t.code}
                  onClick={() => setTariff(t.code)}
                  className={`text-xs px-2 py-2 rounded-lg border transition
                    ${tariff === t.code
                      ? 'border-black bg-brand-yellow font-semibold'
                      : 'border-brand-gray-200 hover:border-brand-gray-500'}`}
                >
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-brand-gray-500">{t.price === 0 ? 'бесплатно' : `${t.price} ₽`}</div>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Имя отправителя (необязательно)">
            <input
              type="text"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Артём"
              className="input"
              maxLength={64}
            />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-brand-yellow hover:bg-brand-yellowDark transition px-5 py-3 rounded-xl text-black font-semibold shadow-card disabled:opacity-50"
          >
            {submitting ? 'Запускаем таракана...' : <>Отправить сообщение <span aria-hidden>🪳</span></>}
          </button>
        </form>

        <div>
          {delivery
            ? <DeliveryTracker initial={delivery} onReset={reset} />
            : <EmptyTracker />}
        </div>
      </div>
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</div>
      {children}
    </label>
  );
}

function EmptyTracker() {
  return (
    <div className="bg-brand-gray-50 border border-dashed border-brand-gray-200 rounded-2xl p-10 text-center text-brand-gray-500 h-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-5xl mb-3" aria-hidden>📭</div>
      <div className="font-semibold text-brand-gray-700">Здесь появится трекинг</div>
      <div className="text-sm mt-1">Отправьте сообщение, чтобы увидеть карточку доставки.</div>
    </div>
  );
}

function DeliveryTracker({ initial, onReset }: { initial: Delivery; onReset: () => void }) {
  const [delivery, setDelivery] = useState<Delivery>(initial);
  const [history, setHistory] = useState<string[]>([initial.status]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDelivery(initial);
    setHistory([initial.status]);
  }, [initial.id, initial]);

  useEffect(() => {
    const isFinal = ['DELIVERED', 'FAILED', 'EATEN', 'HERO_STATUS'].includes(delivery.status);
    if (isFinal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(async () => {
      try {
        const fresh = await getDelivery(delivery.id);
        setDelivery((prev) => {
          if (fresh.status !== prev.status) {
            setHistory((h) => [...h, fresh.status]);
          }
          return fresh;
        });
      } catch {
        // тихо игнорируем
      }
    }, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [delivery.id, delivery.status]);

  const info = statusInfo(delivery.status);
  const colorMap: Record<string, string> = {
    yellow: 'bg-brand-yellow text-black',
    orange: 'bg-orange-500 text-white',
    red: 'bg-rose-500 text-white',
    green: 'bg-emerald-500 text-white',
    gray: 'bg-brand-gray-200 text-black',
    blue: 'bg-blue-500 text-white',
  };

  return (
    <div className="bg-white border border-brand-gray-200 rounded-2xl p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-brand-gray-500">ID заказа</div>
          <div className="font-mono font-bold text-lg">{delivery.id}</div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${colorMap[info.color]}`}>
          {info.emoji} {info.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Cell label="Курьер" value={delivery.bug_name || '—'} />
        <Cell label="Класс" value={delivery.bug_class || '—'} />
        <Cell label="Тариф" value={delivery.tariff} />
        <Cell label="ETA" value={`${delivery.eta_minutes} мин`} />
      </div>

      <div className="border-t border-brand-gray-100 pt-3 mb-3">
        <div className="text-xs text-brand-gray-500 mb-1">Текущий статус</div>
        <div className="text-sm">{info.description}</div>
      </div>

      {delivery.threats?.length > 0 && (
        <div className="border-t border-brand-gray-100 pt-3 mb-3">
          <div className="text-xs text-brand-gray-500 mb-1.5">Угрозы маршрута</div>
          <div className="flex flex-wrap gap-1.5">
            {delivery.threats.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-md bg-brand-gray-100">{t}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-brand-gray-100 pt-3 mb-4">
        <div className="text-xs text-brand-gray-500 mb-2">История статусов</div>
        <ol className="space-y-1.5">
          {history.map((s, i) => {
            const si = statusInfo(s);
            return (
              <li key={`${s}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-brand-gray-300" />
                <span className="font-mono text-xs text-brand-gray-500">{s}</span>
                <span className="text-brand-gray-700">— {si.description}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 px-4 py-2.5 rounded-xl border border-brand-gray-200 hover:border-black text-sm font-semibold transition"
        >
          Отправить ещё одно
        </button>
      </div>

      {info.isFinal && (
        <div className={`mt-4 rounded-xl p-3 text-sm font-semibold text-center
          ${info.isFailure ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {info.isFailure
            ? 'Что-то пошло не так. Бывает. Таракан жил, пока мог.'
            : 'Сообщение доставлено. Таракан жив, даже если интернет мертв.'}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-brand-gray-500">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
