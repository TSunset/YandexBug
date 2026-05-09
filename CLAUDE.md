# YandexBug — Claude Code

## Стек
Go 1.22 backend (chi, pgx, go-redis, JWT) · Next.js 14 + TypeScript frontend · PostgreSQL 16 + Redis 7 · Telegram Bot (go-telegram-bot-api/v5) · Docker Compose

## Справка
- Техническая архитектура → `.claude/rules/reference.md`
- Дизайн-система фронтенда → `.claude/rules/frontend-style-guide.md`
- API контракты фронт ↔ бэк → `.claude/memory/integration-contracts.md`
- Архитектурные решения и причины отказов → `.claude/memory/architecture-decisions.md`
- Архив выполненных задач → `.claude/memory/tasks-completed.md`

---

## Правила (обязательны к исполнению)

### Код
- Бэкенд: ошибки через `fmt.Errorf("context: %w", err)`, не `errors.New`
- Фронтенд: все API-вызовы только через `lib/api.ts` или `lib/auth.ts` или `lib/game.ts` — не писать `fetch` в компонентах напрямую
- JWT передаётся в httpOnly cookie (не localStorage, не заголовок Authorization с фронта)
- Новые SQL-таблицы: создавать миграцию в `backend/migrations/` с парой `up.sql` / `down.sql`
- Не трогать `docker-compose.yml` без явной просьбы — memory limits подобраны под VPS

### Работа
- Перед началом задачи прочитать `integration-contracts.md` если касаешься API
- Если предлагаешь решение — сначала проверь `architecture-decisions.md`, не предлагай отброшенные варианты
- **После каждой задачи (без исключений):** обновить `tasks-completed.md` + если изменился API — обновить `integration-contracts.md`

### Стиль общения
- Отвечать кратко, без пересказа того, что я и так вижу в диффе
- Объяснять WHY, не WHAT
- Если задача неоднозначна — один уточняющий вопрос, не список из пяти
