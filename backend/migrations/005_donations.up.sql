-- Донаты звёздами через Telegram Stars (XTR).
-- Запись создаётся при формировании invoice; обновляется при successful_payment от бота.
CREATE TABLE IF NOT EXISTS donations (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT REFERENCES users(id) ON DELETE SET NULL,
    telegram_chat_id   BIGINT,
    stars              INTEGER NOT NULL CHECK (stars > 0),
    payload            TEXT NOT NULL UNIQUE,
    provider_charge_id TEXT,
    status             TEXT NOT NULL DEFAULT 'pending',
    invoice_url        TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_payload ON donations(payload);
