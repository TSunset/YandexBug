package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yandexbug/backend/internal/models"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) *UserRepo {
	return &UserRepo{pool: pool}
}

const userCols = `id, username, email, password_hash, display_name, telegram_chat_id, telegram_username, avatar_url, created_at, updated_at`

func (r *UserRepo) Create(ctx context.Context, u *models.User) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO users (id, username, email, password_hash, display_name, telegram_chat_id, telegram_username, avatar_url)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		u.ID, u.Username, u.Email, u.PasswordHash, u.DisplayName,
		u.TelegramChatID, u.TelegramUsername, u.AvatarURL)
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, id string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE id = $1`, id)
	return scanUser(row)
}

func (r *UserRepo) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE LOWER(username) = LOWER($1)`, strings.TrimSpace(username))
	return scanUser(row)
}

func (r *UserRepo) GetByTelegramChatID(ctx context.Context, chatID int64) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `SELECT `+userCols+` FROM users WHERE telegram_chat_id = $1`, chatID)
	return scanUser(row)
}

// LinkTelegram — привязывает Telegram-аккаунт к существующему юзеру.
func (r *UserRepo) LinkTelegram(ctx context.Context, userID string, chatID int64, username, avatarURL string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users
		SET telegram_chat_id = $1, telegram_username = NULLIF($2, ''), avatar_url = COALESCE(NULLIF($3, ''), avatar_url), updated_at = NOW()
		WHERE id = $4`,
		chatID, username, avatarURL, userID)
	return err
}

func scanUser(row pgx.Row) (*models.User, error) {
	var u models.User
	err := row.Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.DisplayName,
		&u.TelegramChatID, &u.TelegramUsername, &u.AvatarURL, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}
