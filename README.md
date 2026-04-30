# YandexBug

> **Таракан жив, даже если интернет мертв.**

YandexBug — рофл-стартап и шуточный сервис офлайн-доставки сообщений по городу с помощью летающих тараканов на случай отключения интернета. Это **учебный MVP**: лендинг, рабочий backend, симуляция статусов доставки, Telegram-бот и Docker Compose для запуска одной командой.

Проект сделан как абсурдный продуктовый сайт в стиле современного IT-сервиса: белый фон, чёрный крупный текст, жёлтые акценты, аккуратные карточки. Никакие официальные логотипы Яндекса не используются — пародия исключительно текстовая.

---

## Содержание

- [Что внутри](#что-внутри)
- [Стек](#стек)
- [Структура проекта](#структура-проекта)
- [Быстрый старт](#быстрый-старт)
- [Сервисы](#сервисы)
- [API](#api)
- [Telegram-бот](#telegram-бот)
- [Симуляция доставки](#симуляция-доставки)
- [База данных](#база-данных)
- [Полезные команды](#полезные-команды)
- [Что можно улучшить](#что-можно-улучшить)
- [Дисклеймер](#дисклеймер)

---

## Что внутри

- **Лендинг** на Next.js 14: hero-секция с большой SVG-иллюстрацией летящего таракана, секция «Как это работает», тарифы, статусы доставки, блок для бизнеса с псевдо-дашбордом, форма отправки сообщения, лента последних доставок.
- **Backend на Go**: REST API, машина состояний доставки, фоновая goroutine-симулятор статусов, выбор тараканов с учётом тарифа.
- **Telegram-бот на Go**: пошаговый сценарий `/send`, команды `/tariffs`, `/status`, `/bug`, `/help`. Работает через тот же backend, что и сайт.
- **PostgreSQL** для хранения тарифов, тараканов, доставок и истории событий.
- **Redis** для горячего кэша статусов.
- **docker-compose** поднимает всю систему за одну команду.

---

## Стек

| Компонент      | Технология                                              |
|----------------|---------------------------------------------------------|
| Frontend       | Next.js 14 (App Router), TypeScript, Tailwind CSS      |
| Backend        | Go 1.22, chi (router), pgx (Postgres), go-redis        |
| База данных    | PostgreSQL 16                                          |
| Кэш            | Redis 7                                                |
| Telegram-бот   | Go 1.22, go-telegram-bot-api/v5 (long polling)         |
| Оркестрация    | Docker Compose                                         |

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
│   │   ├── 001_init.up.sql        — схема + сидинг тарифов и тараканов
│   │   └── 001_init.down.sql
│   └── internal/
│       ├── api/                   — chi router, handlers
│       ├── cache/                 — обёртка над Redis
│       ├── config/                — чтение env
│       ├── db/                    — подключение и runner миграций
│       ├── models/                — доменные типы и константы статусов
│       ├── repository/            — tariffs / bugs / deliveries
│       └── service/
│           ├── delivery.go        — создание доставки и выбор таракана
│           └── simulator.go       — фоновая смена статусов
│
├── telegram-bot/
│   ├── Dockerfile
│   ├── go.mod
│   └── main.go                    — все команды бота
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── tsconfig.json
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── globals.css
        ├── lib/
        │   ├── api.ts             — клиент backend
        │   └── statuses.ts        — описания статусов
        └── components/
            ├── Header.tsx
            ├── Hero.tsx
            ├── CockroachIllustration.tsx
            ├── HowItWorks.tsx
            ├── Tariffs.tsx
            ├── Statuses.tsx
            ├── Business.tsx
            ├── SendForm.tsx
            ├── RecentDeliveries.tsx
            └── Footer.tsx
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
# (опционально) впишите TELEGRAM_BOT_TOKEN — иначе бот будет в режиме ожидания
docker compose up --build
```

После того, как все контейнеры поднимутся:

- Сайт: http://localhost:3000
- Backend API: http://localhost:8080
- Health: http://localhost:8080/health

При первом запуске Docker может собирать образы 2–3 минуты (Go-зависимости + npm install).

### Если не нужен Telegram-бот

Можно временно выключить сервис:

```bash
docker compose up --build postgres redis backend frontend
```

Или оставить токен пустым — контейнер бота просто будет в режиме ожидания и не упадёт.

---

## Сервисы

| Сервис         | Порт хоста | Описание                                |
|----------------|-----------|-----------------------------------------|
| `frontend`     | 3000      | Лендинг и форма отправки                |
| `backend`      | 8080      | REST API для сайта и бота               |
| `postgres`     | 5432      | Основная БД                             |
| `redis`        | 6379      | Кэш статусов                            |
| `telegram-bot` | —         | Long-polling бот, не открывает портов   |

---

## API

Все ответы — JSON. CORS открыт для `*` (это MVP).

### `GET /health`
Проверка работы.
```json
{ "status": "ok" }
```

### `GET /tariffs`
Список тарифов.
```json
[
  {
    "code": "bug_pro",
    "name": "Bug Pro",
    "price": 399,
    "description": "Когда сообщение важно",
    "features": ["Доставка по городу", "Обход угроз", "Фото-подтверждение"],
    "success_rate": 0.8,
    "is_popular": true
  }
]
```

### `GET /bugs`
Список доступных тараканов.
```json
[{ "id": 1, "name": "Геннадий", "class": "Flyer", "is_busy": false }]
```

### `POST /deliveries`
Создать доставку.

Запрос:
```json
{
  "recipient_address": "Комната 514",
  "message": "Интернет умер, встречаемся у автомата",
  "tariff": "bug_pro",
  "sender_name": "Артём",
  "notify_channel": "site"
}
```

Ответ (`201 Created`):
```json
{
  "id": "DEL-100500",
  "recipient_address": "Комната 514",
  "message": "Интернет умер, встречаемся у автомата",
  "tariff": "bug_pro",
  "bug_name": "Геннадий",
  "bug_class": "Flyer",
  "status": "BUG_ASSIGNED",
  "eta_minutes": 8,
  "threats": ["кот", "тапок"],
  "priority": "normal",
  "notify_channel": "site",
  "created_at": "2026-04-30T12:00:00Z",
  "updated_at": "2026-04-30T12:00:00Z"
}
```

Валидация:
- `message` не пустой и до 256 символов
- `recipient_address` не пустой
- `tariff` должен существовать (по `code`)

### `GET /deliveries/{id}`
Текущее состояние доставки.

### `GET /deliveries?limit=20`
Последние доставки. Параметр `limit` опциональный (по умолчанию 20, максимум 100).

### `POST /deliveries/{id}/simulate`
Принудительно перевести доставку на следующий статус. Используется ботом и для отладки.

---

## Telegram-бот

Бот работает на long polling и обращается к backend по внутренней docker-сети (`http://backend:8080`).

### Получение токена

1. Откройте `@BotFather` в Telegram.
2. `/newbot` → задайте имя и username.
3. Скопируйте токен в `.env`:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:AAAA-BBBB...
   ```
4. Перезапустите контейнер бота:
   ```bash
   docker compose up -d --build telegram-bot
   docker compose logs -f telegram-bot
   ```

В логах должно появиться `[bot] авторизован как @<имя>`.

### Команды

| Команда   | Что делает                                              |
|-----------|---------------------------------------------------------|
| `/start`  | Приветствие и краткое описание.                        |
| `/help`   | Список всех команд.                                     |
| `/tariffs`| Показать тарифы.                                        |
| `/send`   | Пошаговый сценарий: адрес → сообщение → тариф.         |
| `/status DEL-XXXXXX` | Показать текущий статус доставки.            |
| `/bug`    | Случайный таракан-курьер из базы.                       |
| `/cancel` | Прервать активный диалог.                               |

### Пример ответа после `/send`

```
✅ Сообщение принято.

ID: DEL-100500
Курьер: Геннадий
Класс: Flyer
Тариф: bug_pro
Статус: BUG_ASSIGNED
ETA: 8 мин
Угрозы: кот, тапок

Проверить статус позже: /status DEL-100500

Таракан жив, даже если интернет мертв.
```

---

## Симуляция доставки

Backend стартует фоновую goroutine `Simulator`, которая каждые 3 секунды:

1. Выбирает все активные доставки (`finished_at IS NULL`).
2. Для каждой, у которой прошло 3–6 секунд после последнего обновления, прокручивает машину состояний на один шаг.
3. Записывает событие в `delivery_events`.
4. Если статус терминальный — освобождает таракана (`bugs.is_busy = FALSE`).

### Машина состояний

```
CREATED → PACKED → BUG_ASSIGNED → TAKEOFF → IN_ROUTE
                                                │
                                                ▼
       ┌────── KITCHEN_DELAY / CAT_DETECTED / SLIPPER_DANGER ──────┐
       │       WINDOW_BLOCKED / LOST_SIGNAL                         │
       │                                                            │
       └──→ обратно в IN_ROUTE  ─или─  финал ──→ DELIVERED          │
                                              ──→ FAILED            │
                                              ──→ EATEN             │
                                              ──→ HERO_STATUS       │
                                                                    ◀
```

Из `IN_ROUTE` с вероятностями ~10–15% выпадает каждый из инцидентов; иначе — финализация.
Финал зависит от тарифа:

| Тариф         | Вероятность DELIVERED |
|---------------|-----------------------|
| Bug Free      | 0.45                  |
| Bug Plus      | 0.65                  |
| Bug Pro       | 0.80                  |
| Bug Business  | 0.85                  |
| Bug Ultra     | 0.95                  |

При неудаче с разными весами выбирается `FAILED` / `EATEN` / `HERO_STATUS`.

### Как это видит пользователь

После создания заказа фронт открывает карточку трекинга и каждые 3 секунды дёргает `GET /deliveries/{id}`. Когда статус становится терминальным, polling останавливается.

---

## База данных

### `tariffs`
`id, code, name, price, description, features (jsonb), success_rate, is_popular, sort_order`

### `bugs`
`id, name, class, is_busy`

Классы: `Courier Basic`, `Flyer`, `Heavy Bug`, `Veteran Bug`. Имена — Геннадий, Валера, Аркадий, Борис, Жорик, Иннокентий, Пафнутий, Семён, Григорий, Тарас.

### `deliveries`
`id (DEL-XXXXXX), sender_name, recipient_address, message, tariff_code, bug_id, priority, notify_channel, telegram_chat_id, status, eta_minutes, threats (jsonb), created_at, updated_at, finished_at`

### `delivery_events`
`id, delivery_id, status, comment, created_at` — история переходов.

Миграции применяются автоматически на старте backend из `/app/migrations`. Сидинг тарифов и тараканов — `INSERT ... ON CONFLICT DO NOTHING`, безопасно для повторного запуска.

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

# Зайти в redis-cli
make redis-cli

# Пересобрать образы
make rebuild

# Снести всё, включая данные БД
make clean
```

Без Make:

```bash
docker compose up -d --build
docker compose logs -f backend
docker compose exec postgres psql -U yandexbug -d yandexbug
docker compose down -v   # с удалением volume
```

### Быстрая проверка API из терминала

```bash
# health
curl http://localhost:8080/health

# тарифы
curl http://localhost:8080/tariffs | jq

# создать доставку
curl -X POST http://localhost:8080/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_address": "Кухня",
    "message": "Привет от таракана",
    "tariff": "bug_pro",
    "sender_name": "Тест"
  }' | jq

# статус
curl http://localhost:8080/deliveries/DEL-100500 | jq
```

---

## Что можно улучшить

Этот MVP сознательно простой. Если захочется развивать:

- **WebSocket / SSE** вместо polling для трекинга.
- **Авторизация** и личный кабинет (`users` таблица уже зарезервирована в плане).
- **Реальный корпоративный кабинет**: дашборд из секции «Для бизнеса» сейчас декоративный.
- **i18n** — пока только русский.
- **Метрики и трейсы**: Prometheus + OpenTelemetry в backend.
- **Unit-тесты** на сервисный слой и машину состояний.
- **Rate limiting** на API.
- **Оплата тарифов** — сейчас цены просто отображаются.
- **CI/CD** — GitHub Actions с линтером, build и публикацией образов.
- **Secrets management** — сейчас всё через `.env`, что нормально для MVP, но не для прода.

---

## Дисклеймер

Это **рофл-стартап** и учебный MVP. Никакие реальные тараканы при разработке не пострадали (но и не помогли). Сервис не использует логотипы Яндекса и не аффилирован с Яндексом — название и стилистика являются пародией.

Не пытайтесь повторить это дома.

> Сделано с усами и без логики.
