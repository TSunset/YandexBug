-- Очки мини-игры BugRunner: рекорды пользователей сайта.
CREATE TABLE IF NOT EXISTS game_scores (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score        INTEGER NOT NULL CHECK (score >= 0),
    level        INTEGER NOT NULL DEFAULT 1,
    played_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_scores_top ON game_scores(score DESC, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id, score DESC);
