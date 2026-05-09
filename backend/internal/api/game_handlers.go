package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/yandexbug/backend/internal/auth"
	"github.com/yandexbug/backend/internal/repository"
)

type GameHandlers struct {
	Scores *repository.GameScoreRepo
}

type submitScoreRequest struct {
	Score int `json:"score"`
	Level int `json:"level"`
}

func (h *GameHandlers) SubmitScore(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	var req submitScoreRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}
	if req.Score < 0 || req.Score > 1_000_000 {
		writeError(w, http.StatusBadRequest, "недопустимый счёт")
		return
	}
	if req.Level < 1 {
		req.Level = 1
	}
	if err := h.Scores.Submit(r.Context(), uid, req.Score, req.Level); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{"ok": true})
}

func (h *GameHandlers) Leaderboard(w http.ResponseWriter, r *http.Request) {
	limit := 10
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 50 {
			limit = n
		}
	}
	out, err := h.Scores.TopN(r.Context(), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if out == nil {
		out = []repository.GameScoreEntry{}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *GameHandlers) PersonalBest(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "требуется авторизация")
		return
	}
	score, level, err := h.Scores.PersonalBest(r.Context(), uid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"score": score, "level": level})
}
