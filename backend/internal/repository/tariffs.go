package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yandexbug/backend/internal/models"
)

type TariffRepo struct {
	pool *pgxpool.Pool
}

func NewTariffRepo(pool *pgxpool.Pool) *TariffRepo {
	return &TariffRepo{pool: pool}
}

func (r *TariffRepo) List(ctx context.Context) ([]models.Tariff, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT code, name, price, description, features, success_rate, is_popular, sort_order
		FROM tariffs ORDER BY sort_order ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]models.Tariff, 0)
	for rows.Next() {
		var t models.Tariff
		if err := rows.Scan(&t.Code, &t.Name, &t.Price, &t.Description, &t.Features, &t.SuccessRate, &t.IsPopular, &t.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *TariffRepo) GetByCode(ctx context.Context, code string) (*models.Tariff, error) {
	var t models.Tariff
	err := r.pool.QueryRow(ctx, `
		SELECT code, name, price, description, features, success_rate, is_popular, sort_order
		FROM tariffs WHERE code = $1`, code).
		Scan(&t.Code, &t.Name, &t.Price, &t.Description, &t.Features, &t.SuccessRate, &t.IsPopular, &t.SortOrder)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
