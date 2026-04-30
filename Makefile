.PHONY: help up down restart logs ps clean rebuild backend-logs frontend-logs bot-logs psql redis-cli

help:
	@echo "YandexBug — команды:"
	@echo "  make up           — запустить все сервисы"
	@echo "  make down         — остановить"
	@echo "  make rebuild      — пересобрать образы"
	@echo "  make logs         — логи всех сервисов"
	@echo "  make backend-logs — логи backend"
	@echo "  make frontend-logs — логи frontend"
	@echo "  make bot-logs     — логи telegram-bot"
	@echo "  make psql         — psql shell"
	@echo "  make redis-cli    — redis-cli"
	@echo "  make clean        — снести всё (включая volumes)"

up:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Создал .env из .env.example"; fi
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

rebuild:
	docker compose up -d --build --force-recreate

logs:
	docker compose logs -f

backend-logs:
	docker compose logs -f backend

frontend-logs:
	docker compose logs -f frontend

bot-logs:
	docker compose logs -f telegram-bot

ps:
	docker compose ps

psql:
	docker compose exec postgres psql -U $${POSTGRES_USER:-yandexbug} -d $${POSTGRES_DB:-yandexbug}

redis-cli:
	docker compose exec redis redis-cli

clean:
	docker compose down -v
