package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type GameScoreRepo struct {
	pool *pgxpool.Pool
}

func NewGameScoreRepo(pool *pgxpool.Pool) *GameScoreRepo {
	return &GameScoreRepo{pool: pool}
}

type GameScoreEntry struct {
	UserID      string    `json:"user_id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"display_name"`
	Score       int       `json:"score"`
	Level       int       `json:"level"`
	PlayedAt    time.Time `json:"played_at"`
}

// Submit сохраняет результат игры. Не проверяем что лучший — пусть лидерборд берёт максимум на юзера.
func (r *GameScoreRepo) Submit(ctx context.Context, userID string, score, level int) error {
	if score < 0 {
		score = 0
	}
	if level < 1 {
		level = 1
	}
	_, err := r.pool.Exec(ctx,
		`INSERT INTO game_scores (user_id, score, level) VALUES ($1, $2, $3)`,
		userID, score, level)
	return err
}

// TopN — возвращает топ-N результатов: только лучший рекорд каждого юзера.
func (r *GameScoreRepo) TopN(ctx context.Context, n int) ([]GameScoreEntry, error) {
	if n <= 0 || n > 100 {
		n = 10
	}
	rows, err := r.pool.Query(ctx, `
		SELECT u.id, u.username, COALESCE(u.display_name, u.username), best.max_score, best.level, best.played_at
		FROM (
			SELECT DISTINCT ON (user_id)
				user_id,
				score AS max_score,
				level,
				played_at
			FROM game_scores
			ORDER BY user_id, score DESC, played_at DESC
		) best
		JOIN users u ON u.id = best.user_id
		ORDER BY best.max_score DESC, best.played_at ASC
		LIMIT $1`, n)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]GameScoreEntry, 0, n)
	for rows.Next() {
		var e GameScoreEntry
		if err := rows.Scan(&e.UserID, &e.Username, &e.DisplayName, &e.Score, &e.Level, &e.PlayedAt); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

// PersonalBest — лучший результат конкретного юзера. Возвращает (0,0,nil) если ничего нет.
func (r *GameScoreRepo) PersonalBest(ctx context.Context, userID string) (int, int, error) {
	var score, level int
	row := r.pool.QueryRow(ctx, `
		SELECT score, level FROM game_scores
		WHERE user_id = $1
		ORDER BY score DESC, played_at DESC
		LIMIT 1`, userID)
	if err := row.Scan(&score, &level); err != nil {
		return 0, 0, nil // отсутствие записей не ошибка для UI
	}
	return score, level, nil
}
