package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/yandexbug/backend/internal/models"
)

type DonationRepo struct {
	pool *pgxpool.Pool
}

func NewDonationRepo(pool *pgxpool.Pool) *DonationRepo {
	return &DonationRepo{pool: pool}
}

func (r *DonationRepo) Create(ctx context.Context, d *models.Donation) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO donations (id, user_id, telegram_chat_id, stars, payload, status, invoice_url)
		VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		d.ID, d.UserID, d.TelegramChatID, d.Stars, d.Payload, d.Status, d.InvoiceURL)
	return err
}

func (r *DonationRepo) MarkPaid(ctx context.Context, payload, providerChargeID string, telegramChatID int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE donations
		SET status = 'paid', provider_charge_id = $1, paid_at = NOW(),
		    telegram_chat_id = COALESCE(telegram_chat_id, $2)
		WHERE payload = $3`,
		providerChargeID, telegramChatID, payload)
	return err
}

func (r *DonationRepo) GetByPayload(ctx context.Context, payload string) (*models.Donation, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, user_id, telegram_chat_id, stars, payload, provider_charge_id, status, invoice_url, created_at, paid_at
		FROM donations WHERE payload = $1`, payload)
	return scanDonation(row)
}

func (r *DonationRepo) ListForUser(ctx context.Context, userID string, limit int) ([]models.Donation, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		SELECT id, user_id, telegram_chat_id, stars, payload, provider_charge_id, status, invoice_url, created_at, paid_at
		FROM donations WHERE user_id = $1
		ORDER BY created_at DESC LIMIT $2`, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.Donation, 0)
	for rows.Next() {
		d, err := scanDonation(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *d)
	}
	return out, rows.Err()
}

// TotalStarsForUser — суммарное число донатных звёзд (status=paid).
func (r *DonationRepo) TotalStarsForUser(ctx context.Context, userID string) (int, error) {
	var sum int
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(stars), 0) FROM donations
		WHERE user_id = $1 AND status = 'paid'`, userID).Scan(&sum)
	return sum, err
}

func scanDonation(s scanner) (*models.Donation, error) {
	var d models.Donation
	err := s.Scan(&d.ID, &d.UserID, &d.TelegramChatID, &d.Stars, &d.Payload,
		&d.ProviderChargeID, &d.Status, &d.InvoiceURL, &d.CreatedAt, &d.PaidAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &d, nil
}
