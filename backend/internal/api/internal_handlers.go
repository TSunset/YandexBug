package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/yandexbug/backend/internal/repository"
)

// InternalHandlers — служебные эндпоинты для бота (polling очереди уведомлений).
// В проде доступ к ним нужно ограничить shared secret или сетью; для нашего демо — открыты.
type InternalHandlers struct {
	Pending *repository.PendingTelegramRepo
}

func (h *InternalHandlers) ClaimPending(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	items, err := h.Pending.ClaimBatch(r.Context(), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *InternalHandlers) MarkSent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.Pending.MarkSent(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *InternalHandlers) ReleasePending(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.Pending.ReleaseClaim(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// Утилита, не используется напрямую, но хочется иметь для отладки.
var _ = json.Marshal
