package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yandexbug/backend/internal/models"
)

type TelegramUserRepo struct {
	pool *pgxpool.Pool
}

func NewTelegramUserRepo(pool *pgxpool.Pool) *TelegramUserRepo {
	return &TelegramUserRepo{pool: pool}
}

// Upsert — создаёт/обновляет запись. Username хранится в исходном регистре,
// а ищется по LOWER() для регистронезависимого поиска.
func (r *TelegramUserRepo) Upsert(ctx context.Context, u *models.TelegramUser) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO telegram_users (chat_id, username, first_name, last_name)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (chat_id) DO UPDATE
		SET username = EXCLUDED.username,
		    first_name = EXCLUDED.first_name,
		    last_name = EXCLUDED.last_name,
		    updated_at = NOW()`,
		u.ChatID, u.Username, u.FirstName, u.LastName)
	return err
}

// FindByUsername — ищет по @username без учёта регистра. Возвращает ErrNotFound.
func (r *TelegramUserRepo) FindByUsername(ctx context.Context, username string) (*models.TelegramUser, error) {
	username = strings.TrimPrefix(strings.TrimSpace(username), "@")
	if username == "" {
		return nil, ErrNotFound
	}
	var u models.TelegramUser
	err := r.pool.QueryRow(ctx, `
		SELECT chat_id, username, first_name, last_name, created_at, updated_at
		FROM telegram_users
		WHERE LOWER(username) = LOWER($1)
		LIMIT 1`, username).
		Scan(&u.ChatID, &u.Username, &u.FirstName, &u.LastName, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}
