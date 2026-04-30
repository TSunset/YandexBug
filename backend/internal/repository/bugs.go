package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/yandexbug/backend/internal/models"
)

type BugRepo struct {
	pool *pgxpool.Pool
}

func NewBugRepo(pool *pgxpool.Pool) *BugRepo {
	return &BugRepo{pool: pool}
}

func (r *BugRepo) List(ctx context.Context) ([]models.Bug, error) {
	rows, err := r.pool.Query(ctx, `SELECT id, name, class, is_busy FROM bugs ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]models.Bug, 0)
	for rows.Next() {
		var b models.Bug
		if err := rows.Scan(&b.ID, &b.Name, &b.Class, &b.IsBusy); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// PickAvailable — выбирает свободного таракана:
// 1) предпочтительного класса; 2) любого свободного; 3) случайного (если все заняты).
// Помечает выбранного is_busy=true.
func (r *BugRepo) PickAvailable(ctx context.Context, preferredClass string) (*models.Bug, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var b models.Bug
	picked := false

	if preferredClass != "" {
		err := tx.QueryRow(ctx, `
			SELECT id, name, class, is_busy FROM bugs
			WHERE is_busy = FALSE AND class = $1
			ORDER BY random() LIMIT 1
			FOR UPDATE SKIP LOCKED`, preferredClass).
			Scan(&b.ID, &b.Name, &b.Class, &b.IsBusy)
		if err == nil {
			picked = true
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
	}

	if !picked {
		err := tx.QueryRow(ctx, `
			SELECT id, name, class, is_busy FROM bugs
			WHERE is_busy = FALSE
			ORDER BY random() LIMIT 1
			FOR UPDATE SKIP LOCKED`).
			Scan(&b.ID, &b.Name, &b.Class, &b.IsBusy)
		if err == nil {
			picked = true
		} else if !errors.Is(err, pgx.ErrNoRows) {
			return nil, err
		}
	}

	if !picked {
		// Все заняты — берём случайного
		if err := tx.QueryRow(ctx, `
			SELECT id, name, class, is_busy FROM bugs
			ORDER BY random() LIMIT 1`).
			Scan(&b.ID, &b.Name, &b.Class, &b.IsBusy); err != nil {
			return nil, err
		}
	}

	if _, err := tx.Exec(ctx, `UPDATE bugs SET is_busy = TRUE WHERE id = $1`, b.ID); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	b.IsBusy = true
	return &b, nil
}

func (r *BugRepo) Release(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, `UPDATE bugs SET is_busy = FALSE WHERE id = $1`, id)
	return err
}
