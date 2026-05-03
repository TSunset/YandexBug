package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yandexbug/backend/internal/models"
)

type PendingTelegramRepo struct {
	pool *pgxpool.Pool
}

func NewPendingTelegramRepo(pool *pgxpool.Pool) *PendingTelegramRepo {
	return &PendingTelegramRepo{pool: pool}
}

func (r *PendingTelegramRepo) Enqueue(ctx context.Context, p *models.PendingTelegram) error {
	parseMode := p.ParseMode
	if parseMode == "" {
		parseMode = "HTML"
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO pending_telegram (id, chat_id, text, parse_mode, delivery_id)
		VALUES ($1,$2,$3,$4,$5)`,
		p.ID, p.ChatID, p.Text, parseMode, p.DeliveryID)
	return err
}

// ClaimBatch — атомарно резервирует и возвращает до limit неотправленных сообщений.
// Используем FOR UPDATE SKIP LOCKED, чтобы было безопасно при нескольких воркерах.
func (r *PendingTelegramRepo) ClaimBatch(ctx context.Context, limit int) ([]models.PendingTelegram, error) {
	if limit <= 0 {
		limit = 20
	}
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	rows, err := tx.Query(ctx, `
		SELECT id, chat_id, text, parse_mode, delivery_id, created_at
		FROM pending_telegram
		WHERE sent_at IS NULL AND (claimed_at IS NULL OR claimed_at < NOW() - INTERVAL '60 seconds')
		ORDER BY created_at
		LIMIT $1
		FOR UPDATE SKIP LOCKED`, limit)
	if err != nil {
		return nil, err
	}

	out := make([]models.PendingTelegram, 0)
	ids := make([]string, 0)
	for rows.Next() {
		var p models.PendingTelegram
		if err := rows.Scan(&p.ID, &p.ChatID, &p.Text, &p.ParseMode, &p.DeliveryID, &p.CreatedAt); err != nil {
			rows.Close()
			return nil, err
		}
		out = append(out, p)
		ids = append(ids, p.ID)
	}
	rows.Close()

	if len(ids) > 0 {
		now := time.Now().UTC()
		if _, err := tx.Exec(ctx, `UPDATE pending_telegram SET claimed_at = $1 WHERE id = ANY($2)`, now, ids); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *PendingTelegramRepo) MarkSent(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE pending_telegram SET sent_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *PendingTelegramRepo) ReleaseClaim(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `UPDATE pending_telegram SET claimed_at = NULL WHERE id = $1`, id)
	return err
}
