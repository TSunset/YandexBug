# YandexBug

> **Таракан жив, даже если интернет мёртв.**

YandexBug — рофл-стартап и шуточный сервис офлайн-доставки сообщений по городу с помощью летающих тараканов на случай отключения интернета. Это **полноценный MVP**: кибerpunk-лендинг, рабочий backend, симуляция статусов доставки, Telegram-бот, система регистрации/авторизации, личный кабинет с входящими, Telegram Stars донаты и Docker Compose для запуска одной командой.

Задеплоен на сервере: **http://83.217.202.201**

---

## Содержание

- [Что внутри](#что-внутри)
- [Стек](#стек)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Сервисы](#сервисы)
- [Авторизация](#авторизация)
- [API](#api)
- [Telegram-бот](#telegram-бот)
- [Симуляция доставки](#симуляция-доставки)
- [Donations (Telegram Stars)](#donations-telegram-stars)
- [База данных](#база-данных)
- [Деплой на сервер](#деплой-на-сервер)
- [Полезные команды](#полезные-команды)
- [Дисклеймер](#дисклеймер)

---

## Что внутри

- **Cyberpunk-лендинг** на Next.js 14: hero-секция с тараканом в жёлтом прожекторе, угловые маркеры, scanlines, шрифты Bricolage Grotesque + JetBrains Mono, тёмная палитра с токсичным жёлтым `#ECE81A`.
- **Авторизация**: регистрация/логин по логину+паролю (bcrypt cost 11, JWT HS256 в httpOnly cookie), личный кабинет, входящие сообщения.
- **Backend на Go**: REST API, машина состояний доставки, фоновая goroutine-симулятор, система Inbox, очередь уведомлений в Telegram.
- **Telegram-бот на Go**: пошаговый сценарий `/send`, анимация прогресса доставки (редактирование одного сообщения), команды `/tariffs`, `/status`, `/bug`, `/donate`, `/author`.
- **Telegram Stars**: пожертвования от 1 до 10 000 ⭐, инлайн-кнопки с пресетами, обработка `pre_checkout_query`.
- **Посвящение**: в футере сайта и по команде `/author` — фотография Вари с сердечком ❤️.
- **PostgreSQL** + **Redis** для хранения данных и горячего кэша.
- **Docker Compose** поднимает 5 сервисов за одну команду.

---

## Стек

| Компонент      | Технология                                                    |
|----------------|---------------------------------------------------------------|
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind CSS            |
| Backend        | Go 1.22, chi (router), pgx/v5 (Postgres), go-redis           |
| Auth           | bcrypt (cost 11), JWT HS256, httpOnly cookie                  |
| База данных    | PostgreSQL 16                                                 |
| Кэш            | Redis 7                                                       |
| Telegram-бот   | Go 1.22, go-telegram-bot-api/v5, golang.org/x/net (SOCKS5)   |
| Оркестрация    | Docker Compose v2                                             |
| Reverse proxy  | nginx                                                         |

---

## Структура проекта

```
yandexbug/
├── docker-compose.yml
├── .env.example
├── Makefile
│
├── backend/
│   ├── Dockerfile
│   ├── go.mod
│   ├── cmd/server/main.go
│   ├── migrations/
│   │   ├── 001_init.up.sql          — tariffs, bugs, deliveries, events
│   │   ├── 002_telegram_users.up.sql
│   │   ├── 003_users.up.sql         — site users + JWT auth
│   │   ├── 004_inbox.up.sql         — inbox_messages, pending_telegram
│   │   └── 005_donations.up.sql     — Telegram Stars donations
│   └── internal/
│       ├── api/                     — chi router, handlers (auth, inbox, users, donations)
│       ├── auth/                    — bcrypt, JWT issue/parse, middleware, RequireAuth
│       ├── cache/                   — Redis wrapper
│       ├── config/                  — env config
│       ├── db/                      — connection + migration runner
│       ├── models/                  — domain types, status constants
│       ├── repository/              — tariffs / bugs / deliveries / users / inbox / donations
│       └── service/
│           ├── delivery.go          — create delivery, bug assignment
│           ├── simulator.go         — background status machine (70% success rate)
│           ├── notifier.go          — OnFinal: inbox + pending_telegram
│           └── telegram_api.go      — createInvoiceLink for Stars
│
├── telegram-bot/
│   ├── Dockerfile
│   ├── go.mod
│   ├── main.go                      — все команды + SOCKS5 proxy support
│   └── static/
│       └── photo.jpg                — фото для /author
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tailwind.config.ts           — cyberpunk палитра (ink-*, toxic, terminal, danger)
    └── app/
        ├── layout.tsx               — Bricolage Grotesque + JetBrains Mono
        ├── page.tsx
        ├── globals.css              — grid lines, noise, spotlight, btn-brutal
        ├── contexts/
        │   └── AuthContext.tsx      — user state, refresh on mount
        ├── lib/
        │   ├── auth.ts              — register/login/logout/me/lookupRecipient/inbox
        │   └── api.ts               — deliveries API client
        └── components/
            ├── Header.tsx           — nav + auth state (login/inbox/logout)
            ├── Hero.tsx             — таракан с жёлтым прожектором и corner marks
            ├── SendForm.tsx         — auth guard + live recipient lookup
            ├── Tariffs.tsx
            ├── RecentDeliveries.tsx
            ├── Footer.tsx           — посвящение Варе ❤️
            └── ...
```

---

## Быстрый старт

### Требования

- Docker 24+ и Docker Compose plugin
- Свободные порты `3000`, `5432`, `6379`, `8080`

### Запуск

```bash
git clone https://github.com/TSunset/YandexBug.git
cd YandexBug
cp .env.example .env
# Впишите TELEGRAM_BOT_TOKEN и JWT_SECRET в .env
docker compose up --build
```

После того, как все контейнеры поднимутся:

- Сайт: http://localhost:3000
- Backend API: http://localhost:8080
- Health: http://localhost:8080/health

При первом запуске Docker собирает образы 3–5 минут (Go-зависимости + npm install).

### Переменные окружения

| Переменная               | Описание                                                       |
|--------------------------|----------------------------------------------------------------|
| `POSTGRES_*`             | Данные для PostgreSQL                                          |
| `DATABASE_URL`           | DSN для backend                                                |
| `REDIS_URL`              | URL Redis                                                      |
| `TELEGRAM_BOT_TOKEN`     | Токен бота от @BotFather                                       |
| `JWT_SECRET`             | Секрет для подписи JWT (поменяйте на случайную строку)         |
| `NEXT_PUBLIC_API_URL`    | URL backend, **видимый из браузера** (для прода: IP/домен)     |
| `NEXT_PUBLIC_TG_BOT_USERNAME` | Username бота без @ (для кнопки в форме)                 |
| `ALLOWED_ORIGINS`        | CORS whitelist через запятую (напр. `http://83.217.202.201`)   |
| `SOCKS5_PROXY`           | SOCKS5-прокси для бота (напр. `socks5://127.0.0.1:9050`)       |

---

## Сервисы

| Сервис         | Порт хоста | Описание                                         |
|----------------|-----------|--------------------------------------------------|
| `frontend`     | 3000      | Cyberpunk-лендинг, форма отправки, inbox         |
| `backend`      | 8080      | REST API — доставки, auth, inbox, donations      |
| `postgres`     | 5432      | Основная БД                                      |
| `redis`        | 6379      | Кэш статусов                                     |
| `telegram-bot` | —         | Long-polling бот, не открывает портов            |

---

## Авторизация

Сайт поддерживает регистрацию и вход по логину/паролю.

- **Регистрация**: `POST /auth/register` — `username` (3–32 символа a-z 0-9 _), `password` (мин. 6), опционально `display_name` и `email`.
- **Логин**: `POST /auth/login` — возвращает JWT в httpOnly cookie `yb_auth` (TTL 7 дней).
- **Текущий пользователь**: `GET /auth/me`.
- **Выход**: `POST /auth/logout`.

После входа открываются:
- Форма отправки сообщения (с поиском получателя по `@username`)
- Страница входящих `/inbox`

### Как связать Telegram с аккаунтом

Напишите боту `/start` — бот зарегистрирует ваш Telegram chat_id. После этого отправитель сможет найти вас по `@telegram_username` в форме сайта, и вы получите уведомление в Telegram о доставке.

---

## API

Все ответы — JSON. Аутентификация через cookie `yb_auth` (JWT) или заголовок `Authorization: Bearer <token>`.

### Публичные endpoints

```
GET  /health
GET  /tariffs
GET  /bugs
GET  /deliveries
POST /deliveries
GET  /deliveries/{id}
POST /deliveries/{id}/simulate
GET  /users/lookup/{handle}
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /donations/create-invoice
GET  /donations/by-payload/{payload}
```

### Защищённые (требуют JWT)

```
GET  /inbox
GET  /inbox/unread-count
POST /inbox/{id}/read
GET  /donations/me
POST /auth/link-telegram
```

### Пример: создать доставку

```bash
curl -X POST http://localhost:8080/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_address": "Кухня",
    "message": "Привет от таракана",
    "tariff": "bug_pro",
    "sender_name": "Тест"
  }'
```

---

## Telegram-бот

Бот работает на long polling и обращается к backend по внутренней docker-сети (`http://backend:8080`).

### Команды

| Команда           | Что делает                                                        |
|-------------------|-------------------------------------------------------------------|
| `/start`          | Приветствие, регистрация chat_id, краткое описание               |
| `/help`           | Список всех команд                                                |
| `/tariffs`        | Тарифы с ценами и описанием                                       |
| `/send`           | Пошаговый сценарий: получатель → сообщение → тариф               |
| `/status DEL-ID`  | Текущий статус доставки                                           |
| `/bug`            | Случайный таракан-курьер из базы                                  |
| `/donate`         | Задонатить звёздами ⭐ (инлайн-кнопки: 50 / 200 / 1000 или своё) |
| `/author`         | Автор идеи — фото Вари с подписью ❤️                             |
| `/cancel`         | Прервать активный диалог                                          |

### Анимация доставки

При отправке через бота (`/send`) прогресс доставки анимируется в **одном сообщении** — бот редактирует его каждые ~4 секунды, обновляя прогресс-бар и статус. Это длится 30–60 секунд до финального результата.

```
🪳 DELIVERY // DEL-100500
━━━━━━━━━━━━━━━━━ 60%

📦 PACKED
🪲 BUG_ASSIGNED
🛫 TAKEOFF
🛣 IN_ROUTE ← текущий

⏱ ETA: ~8 мин
🚨 Угрозы: кот, тапок
```

### SOCKS5 / Tor (для серверов в России)

Если Telegram заблокирован провайдером, задайте переменную:

```env
SOCKS5_PROXY=socks5://127.0.0.1:9050
```

На сервере для этого установлен Tor с obfs4-мостами:

```bash
# Установка на Ubuntu
apt-get install tor obfs4proxy
# /etc/tor/torrc — UseBridges 1 + Bridge obfs4 ...
systemctl enable --now tor@default
```

Бот автоматически использует прокси, если `SOCKS5_PROXY` задан.

---

## Симуляция доставки

Backend стартует фоновую goroutine `Simulator`, которая каждые 3 секунды:

1. Выбирает все активные доставки (`finished_at IS NULL`).
2. Для каждой прокручивает машину состояний на один шаг.
3. Записывает событие в `delivery_events`.
4. При финальном статусе: создаёт запись в `inbox_messages` (для site-юзеров) и в `pending_telegram` (для уведомления через бота).

### Машина состояний

```
CREATED → PACKED → BUG_ASSIGNED → TAKEOFF → IN_ROUTE
                                                │
                                                ▼
       ┌── KITCHEN_DELAY / CAT_DETECTED / SLIPPER_DANGER ──┐
       │   WINDOW_BLOCKED / LOST_SIGNAL                      │
       │                                                     │
       └──→ обратно в IN_ROUTE  ─или─  финал:               │
                                    DELIVERED                │
                                    FAILED                   │
                                    EATEN                    │
                                    HERO_STATUS              ◀
```

**Вероятность успеха: 70% для всех тарифов** (потому что тараканы честные).

### Уведомления

- **Site-пользователь**: при финале создаётся `inbox_message`, счётчик непрочитанных обновляется в шапке сайта.
- **Telegram-пользователь**: создаётся запись в `pending_telegram`, бот-воркер раз в 3 секунды забирает очередь и отправляет финальное уведомление.

---

## Donations (Telegram Stars)

```
/donate → инлайн-кнопки [50⭐] [200⭐] [1000⭐] [своя сумма]
        → backend: POST /donations/create-invoice
        → Telegram Invoice (XTR currency)
        → pre_checkout_query (бот отвечает в 10 сек)
        → successful_payment → POST /internal/donations/{payload}/paid
```

Используется официальный Telegram Stars API (`currency=XTR`, `provider_token=""`).

---

## База данных

### Таблицы

| Таблица            | Описание                                                    |
|--------------------|-------------------------------------------------------------|
| `tariffs`          | Тарифы с ценами, фичами, популярностью                      |
| `bugs`             | Тараканы-курьеры: имя, класс, занятость                     |
| `deliveries`       | Доставки: статус, маршрут, угрозы, получатель               |
| `delivery_events`  | История переходов статусов                                  |
| `telegram_users`   | Зарегистрированные Telegram-пользователи (chat_id, username) |
| `users`            | Пользователи сайта: bcrypt-хеш, JWT, telegram linkage       |
| `inbox_messages`   | Входящие сообщения для site-юзеров                          |
| `pending_telegram` | Очередь уведомлений для Telegram-бота                       |
| `donations`        | История донатов через Telegram Stars                        |

Миграции применяются автоматически на старте backend из `/app/migrations`. Сидинг тарифов и тараканов — `INSERT ... ON CONFLICT DO NOTHING`.

---

## Деплой на сервер

Сервис задеплоен на VPS (Ubuntu 24.04, TimeWeb).

```bash
# На сервере
git clone https://github.com/TSunset/YandexBug.git /opt/yandexbug
cd /opt/yandexbug
cp .env.example .env
# Заполнить .env:
#   NEXT_PUBLIC_API_URL=http://<IP>:8080
#   ALLOWED_ORIGINS=http://<IP>
#   SOCKS5_PROXY=socks5://127.0.0.1:9050  (если Telegram заблокирован)
docker compose up -d --build
```

**nginx** настроен как reverse proxy на порту 80 → frontend :3000.

**Tor + obfs4** используется как SOCKS5-прокси для бота (обход DPI-блокировки Telegram на российских VPS).

### Дамп и восстановление БД

```bash
# Снять дамп с локальной БД
docker exec yandexbug-postgres pg_dump -U yandexbug -d yandexbug \
  --no-owner --no-acl -f /tmp/dump.sql
docker cp yandexbug-postgres:/tmp/dump.sql ./dump.sql

# Восстановить на сервере (с отключением FK для корректного порядка)
docker cp dump.sql yandexbug-postgres:/tmp/dump.sql
docker exec yandexbug-postgres psql -U yandexbug -d yandexbug \
  -c "SET session_replication_role = replica;" \
  -f /tmp/dump.sql \
  -c "SET session_replication_role = DEFAULT;"
```

---

## Полезные команды

```bash
# Поднять всё
make up

# Логи всех сервисов
make logs

# Логи отдельных сервисов
make backend-logs
make frontend-logs
make bot-logs

# Зайти в psql
make psql

# Пересобрать образы
make rebuild

# Снести всё, включая данные БД
make clean
```

Без Make:

```bash
docker compose up -d --build
docker compose logs -f telegram-bot
docker compose exec postgres psql -U yandexbug -d yandexbug
docker compose down -v   # с удалением volume
```

---

## Дисклеймер

Это **рофл-стартап** и учебный MVP. Никакие реальные тараканы при разработке не пострадали (но и не помогли). Сервис не использует логотипы Яндекса и не аффилирован с Яндексом — название и стилистика являются пародией.

Не пытайтесь повторить это дома.

> Сделано с усами и без логики. Посвящается Варе ❤️
