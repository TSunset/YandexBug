package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/yandexbug/backend/internal/auth"
	"github.com/yandexbug/backend/internal/repository"
)

type InboxHandlers struct {
	Inbox *repository.InboxRepo
}

func (h *InboxHandlers) List(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	limit := 50
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	out, err := h.Inbox.ListForUser(r.Context(), uid, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	unread, _ := h.Inbox.UnreadCount(r.Context(), uid)
	writeJSON(w, http.StatusOK, map[string]any{
		"messages":     out,
		"unread_count": unread,
	})
}

func (h *InboxHandlers) MarkRead(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	id := chi.URLParam(r, "id")
	if err := h.Inbox.MarkRead(r.Context(), uid, id); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *InboxHandlers) UnreadCount(w http.ResponseWriter, r *http.Request) {
	uid := auth.UserID(r.Context())
	n, err := h.Inbox.UnreadCount(r.Context(), uid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]int{"unread_count": n})
}
