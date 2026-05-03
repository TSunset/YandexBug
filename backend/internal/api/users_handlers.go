package api

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/yandexbug/backend/internal/repository"
)

type UsersHandlers struct {
	Users         *repository.UserRepo
	TelegramUsers *repository.TelegramUserRepo
}

// LookupResult — единый ответ для поиска получателя:
// найден ли он как пользователь сайта, или только как Telegram-пользователь.
type LookupResult struct {
	Kind          string  `json:"kind"` // "site_user" | "telegram_user"
	Handle        string  `json:"handle"`
	DisplayName   string  `json:"display_name"`
	UserID        *string `json:"user_id,omitempty"`
	TelegramChat  *int64  `json:"telegram_chat_id,omitempty"`
	HasTelegram   bool    `json:"has_telegram"`
	AvatarURL     *string `json:"avatar_url,omitempty"`
}

// Lookup — ищет получателя по handle. Сначала среди пользователей сайта,
// потом среди Telegram-пользователей. handle принимает форму "username" или "@username".
func (h *UsersHandlers) Lookup(w http.ResponseWriter, r *http.Request) {
	handle := strings.TrimPrefix(strings.TrimSpace(chi.URLParam(r, "handle")), "@")
	if handle == "" {
		writeError(w, http.StatusBadRequest, "пустой handle")
		return
	}

	if u, err := h.Users.GetByUsername(r.Context(), handle); err == nil {
		res := LookupResult{
			Kind:        "site_user",
			Handle:      u.Username,
			DisplayName: u.DisplayName,
			UserID:      &u.ID,
			AvatarURL:   u.AvatarURL,
			HasTelegram: u.TelegramChatID != nil,
			TelegramChat: u.TelegramChatID,
		}
		writeJSON(w, http.StatusOK, res)
		return
	} else if !errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if tu, err := h.TelegramUsers.FindByUsername(r.Context(), handle); err == nil {
		display := handle
		if tu.FirstName != nil && *tu.FirstName != "" {
			display = *tu.FirstName
		}
		chatID := tu.ChatID
		res := LookupResult{
			Kind:         "telegram_user",
			Handle:       "@" + handle,
			DisplayName:  display,
			HasTelegram:  true,
			TelegramChat: &chatID,
		}
		writeJSON(w, http.StatusOK, res)
		return
	}

	writeError(w, http.StatusNotFound, "получатель не найден")
}
