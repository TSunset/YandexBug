-- Зарегистрированные пользователи Telegram-бота.
-- Заполняется когда пользователь нажимает /start у бота.
CREATE TABLE IF NOT EXISTS telegram_users (
    chat_id     BIGINT PRIMARY KEY,
    username    TEXT,
    first_name  TEXT,
    last_name   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_users_username ON telegram_users(LOWER(username));
