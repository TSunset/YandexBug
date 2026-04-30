package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"github.com/yandexbug/backend/internal/repository"
	"github.com/yandexbug/backend/internal/service"
)

type Handlers struct {
	Deliveries *service.DeliveryService
	Tariffs    *repository.TariffRepo
	Bugs       *repository.BugRepo
}

func (h *Handlers) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (h *Handlers) ListTariffs(w http.ResponseWriter, r *http.Request) {
	out, err := h.Tariffs.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handlers) ListBugs(w http.ResponseWriter, r *http.Request) {
	out, err := h.Bugs.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

type createDeliveryRequest struct {
	SenderName       string `json:"sender_name"`
	RecipientAddress string `json:"recipient_address"`
	Message          string `json:"message"`
	Tariff           string `json:"tariff"`
	Priority         string `json:"priority"`
	NotifyChannel    string `json:"notify_channel"`
	TelegramChatID   *int64 `json:"telegram_chat_id,omitempty"`
}

func (h *Handlers) CreateDelivery(w http.ResponseWriter, r *http.Request) {
	var req createDeliveryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}
	d, err := h.Deliveries.Create(r.Context(), service.CreateDeliveryInput{
		SenderName:       req.SenderName,
		RecipientAddress: req.RecipientAddress,
		Message:          req.Message,
		TariffCode:       req.Tariff,
		Priority:         req.Priority,
		NotifyChannel:    req.NotifyChannel,
		TelegramChatID:   req.TelegramChatID,
	})
	if err != nil {
		if errors.Is(err, service.ErrInvalidInput) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, d)
}

func (h *Handlers) GetDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	d, err := h.Deliveries.Get(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "доставка не найдена")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func (h *Handlers) ListDeliveries(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if v := r.URL.Query().Get("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			limit = n
		}
	}
	out, err := h.Deliveries.ListRecent(r.Context(), limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *Handlers) SimulateDelivery(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	d, err := h.Deliveries.SimulateForce(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeError(w, http.StatusNotFound, "доставка не найдена")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
