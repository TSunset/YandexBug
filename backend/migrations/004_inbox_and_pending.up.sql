-- Входящие сообщения для пользователей сайта.
CREATE TABLE IF NOT EXISTS inbox_messages (
    id                 TEXT PRIMARY KEY,
    recipient_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    delivery_id        TEXT REFERENCES deliveries(id) ON DELETE SET NULL,
    sender_display     TEXT NOT NULL,
    message            TEXT NOT NULL,
    is_read            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_recipient ON inbox_messages(recipient_user_id, created_at DESC);

-- Очередь сообщений для отправки через Telegram-бота.
-- Бэкенд пишет, бот периодически читает и отправляет.
CREATE TABLE IF NOT EXISTS pending_telegram (
    id           TEXT PRIMARY KEY,
    chat_id      BIGINT NOT NULL,
    text         TEXT NOT NULL,
    parse_mode   TEXT NOT NULL DEFAULT 'HTML',
    delivery_id  TEXT,
    sent_at      TIMESTAMPTZ,
    claimed_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_telegram_unsent ON pending_telegram(created_at) WHERE sent_at IS NULL;

-- Расширяем deliveries: запоминаем получателя-пользователя (если найден).
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS recipient_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;
