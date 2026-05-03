-- Пользователи сайта. Логин по username+password ИЛИ Telegram Login Widget.
-- При входе через Telegram password_hash остаётся NULL.
CREATE TABLE IF NOT EXISTS users (
    id                TEXT PRIMARY KEY,
    username          TEXT NOT NULL UNIQUE,
    email             TEXT UNIQUE,
    password_hash     TEXT,
    display_name      TEXT NOT NULL,
    telegram_chat_id  BIGINT UNIQUE,
    telegram_username TEXT,
    avatar_url        TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_tg_chat_id ON users(telegram_chat_id);
