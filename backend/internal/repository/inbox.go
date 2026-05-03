package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yandexbug/backend/internal/models"
)

type InboxRepo struct {
	pool *pgxpool.Pool
}

func NewInboxRepo(pool *pgxpool.Pool) *InboxRepo {
	return &InboxRepo{pool: pool}
}

func (r *InboxRepo) Create(ctx context.Context, m *models.InboxMessage) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO inbox_messages (id, recipient_user_id, delivery_id, sender_display, message)
		VALUES ($1,$2,$3,$4,$5)`,
		m.ID, m.RecipientUserID, m.DeliveryID, m.SenderDisplay, m.Message)
	return err
}

func (r *InboxRepo) ListForUser(ctx context.Context, userID string, limit int) ([]models.InboxMessage, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, recipient_user_id, delivery_id, sender_display, message, is_read, created_at
		FROM inbox_messages
		WHERE recipient_user_id = $1
		ORDER BY created_at DESC
		LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.InboxMessage, 0)
	for rows.Next() {
		var m models.InboxMessage
		if err := rows.Scan(&m.ID, &m.RecipientUserID, &m.DeliveryID, &m.SenderDisplay, &m.Message, &m.IsRead, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func (r *InboxRepo) MarkRead(ctx context.Context, userID, msgID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE inbox_messages SET is_read = TRUE
		WHERE id = $1 AND recipient_user_id = $2`, msgID, userID)
	return err
}

func (r *InboxRepo) UnreadCount(ctx context.Context, userID string) (int, error) {
	var n int
	err := r.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM inbox_messages WHERE recipient_user_id = $1 AND is_read = FALSE`, userID).Scan(&n)
	return n, err
}
