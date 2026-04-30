package repository

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yandexbug/backend/internal/models"
)

type DeliveryRepo struct {
	pool *pgxpool.Pool
}

func NewDeliveryRepo(pool *pgxpool.Pool) *DeliveryRepo {
	return &DeliveryRepo{pool: pool}
}

var ErrNotFound = errors.New("not found")

func (r *DeliveryRepo) Create(ctx context.Context, d *models.Delivery) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO deliveries
			(id, sender_name, recipient_address, message, tariff_code, bug_id, priority,
			 notify_channel, telegram_chat_id, status, eta_minutes, threats, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		d.ID, d.SenderName, d.RecipientAddress, d.Message, d.TariffCode, d.BugID, d.Priority,
		d.NotifyChannel, d.TelegramChatID, d.Status, d.ETAMinutes, d.Threats, d.CreatedAt, d.UpdatedAt)
	return err
}

func (r *DeliveryRepo) AppendEvent(ctx context.Context, deliveryID, status, comment string) error {
	var c *string
	if comment != "" {
		c = &comment
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO delivery_events (delivery_id, status, comment) VALUES ($1, $2, $3)`,
		deliveryID, status, c)
	return err
}

func (r *DeliveryRepo) UpdateStatus(ctx context.Context, deliveryID, status string, finished bool) error {
	now := time.Now().UTC()
	if finished {
		_, err := r.pool.Exec(ctx, `
			UPDATE deliveries SET status = $1, updated_at = $2, finished_at = $2 WHERE id = $3`,
			status, now, deliveryID)
		return err
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE deliveries SET status = $1, updated_at = $2 WHERE id = $3`, status, now, deliveryID)
	return err
}

func (r *DeliveryRepo) Get(ctx context.Context, id string) (*models.Delivery, error) {
	row := r.pool.QueryRow(ctx, querySelect+` WHERE d.id = $1`, id)
	d, err := scanDelivery(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return d, nil
}

func (r *DeliveryRepo) ListRecent(ctx context.Context, limit int) ([]models.Delivery, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, querySelect+` ORDER BY d.created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]models.Delivery, 0)
	for rows.Next() {
		d, err := scanDelivery(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *d)
	}
	return out, rows.Err()
}

func (r *DeliveryRepo) ListActive(ctx context.Context) ([]models.Delivery, error) {
	rows, err := r.pool.Query(ctx, querySelect+` WHERE d.finished_at IS NULL ORDER BY d.updated_at ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]models.Delivery, 0)
	for rows.Next() {
		d, err := scanDelivery(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *d)
	}
	return out, rows.Err()
}

const querySelect = `
	SELECT d.id, d.sender_name, d.recipient_address, d.message, d.tariff_code,
	       d.bug_id, d.priority, d.notify_channel, d.telegram_chat_id,
	       d.status, d.eta_minutes, d.threats, d.created_at, d.updated_at, d.finished_at,
	       b.name, b.class
	FROM deliveries d
	LEFT JOIN bugs b ON b.id = d.bug_id`

type scanner interface {
	Scan(dest ...any) error
}

func scanDelivery(s scanner) (*models.Delivery, error) {
	var d models.Delivery
	err := s.Scan(
		&d.ID, &d.SenderName, &d.RecipientAddress, &d.Message, &d.TariffCode,
		&d.BugID, &d.Priority, &d.NotifyChannel, &d.TelegramChatID,
		&d.Status, &d.ETAMinutes, &d.Threats, &d.CreatedAt, &d.UpdatedAt, &d.FinishedAt,
		&d.BugName, &d.BugClass,
	)
	if err != nil {
		return nil, err
	}
	if d.Threats == nil {
		d.Threats = []string{}
	}
	return &d, nil
}
