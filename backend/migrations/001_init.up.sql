-- Тарифы
CREATE TABLE IF NOT EXISTS tariffs (
    id          SERIAL PRIMARY KEY,
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    price       INTEGER NOT NULL,
    description TEXT NOT NULL,
    features    JSONB NOT NULL DEFAULT '[]'::jsonb,
    success_rate REAL NOT NULL DEFAULT 0.5,
    is_popular  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Тараканы
CREATE TABLE IF NOT EXISTS bugs (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL,
    class   TEXT NOT NULL,
    is_busy BOOLEAN NOT NULL DEFAULT FALSE
);

-- Доставки
CREATE TABLE IF NOT EXISTS deliveries (
    id                TEXT PRIMARY KEY,
    sender_name       TEXT,
    recipient_address TEXT NOT NULL,
    message           TEXT NOT NULL,
    tariff_code       TEXT NOT NULL REFERENCES tariffs(code),
    bug_id            INTEGER REFERENCES bugs(id),
    priority          TEXT NOT NULL DEFAULT 'normal',
    notify_channel    TEXT NOT NULL DEFAULT 'site',
    telegram_chat_id  BIGINT,
    status            TEXT NOT NULL,
    eta_minutes       INTEGER NOT NULL DEFAULT 0,
    threats           JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_status     ON deliveries(status);

-- История событий
CREATE TABLE IF NOT EXISTS delivery_events (
    id          SERIAL PRIMARY KEY,
    delivery_id TEXT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    status      TEXT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_events_delivery_id ON delivery_events(delivery_id);

-- Сидинг тарифов
INSERT INTO tariffs (code, name, price, description, features, success_rate, is_popular, sort_order) VALUES
    ('bug_free',     'Bug Free',     0,    'Для тех, кому не горит',
        '["Доставка в пределах подъезда", "Без приоритета", "Возможна задержка"]'::jsonb,
        0.45, FALSE, 1),
    ('bug_plus',     'Bug Plus',     199,  'Быстрее, но не сильно',
        '["Доставка по району", "Приоритетный вылет", "Статус в реальном времени"]'::jsonb,
        0.65, FALSE, 2),
    ('bug_pro',      'Bug Pro',      399,  'Когда сообщение важно',
        '["Доставка по городу", "Обход угроз", "Фото-подтверждение"]'::jsonb,
        0.80, TRUE,  3),
    ('bug_business', 'Bug Business', 999,  'Для офиса и команды',
        '["Корпоративный кабинет", "SLA 99% — ну почти", "Интеграция и отчёты"]'::jsonb,
        0.85, FALSE, 4),
    ('bug_ultra',    'Bug Ultra',    2999, 'Для параноиков и срочных',
        '["Мгновенный вылет", "Личный таракан-курьер", "Доставка за 5 минут*"]'::jsonb,
        0.95, FALSE, 5)
ON CONFLICT (code) DO NOTHING;

-- Сидинг тараканов
INSERT INTO bugs (name, class) VALUES
    ('Геннадий',   'Flyer'),
    ('Валера',     'Courier Basic'),
    ('Аркадий',    'Heavy Bug'),
    ('Борис',      'Veteran Bug'),
    ('Жорик',      'Flyer'),
    ('Иннокентий', 'Courier Basic'),
    ('Пафнутий',   'Heavy Bug'),
    ('Семён',      'Veteran Bug'),
    ('Григорий',   'Flyer'),
    ('Тарас',      'Courier Basic')
ON CONFLICT DO NOTHING;
