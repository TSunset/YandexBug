package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/yandexbug/backend/internal/auth"
	"github.com/yandexbug/backend/internal/models"
	"github.com/yandexbug/backend/internal/repository"
)

type AuthDeps struct {
	Users     *repository.UserRepo
	Secret    []byte
	BotToken  string
}

type AuthHandlers struct {
	D AuthDeps
}

var usernameRe = regexp.MustCompile(`^[a-zA-Z0-9_]{3,32}$`)

type registerReq struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
}

func (h *AuthHandlers) Register(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}
	req.Username = strings.TrimSpace(req.Username)
	req.DisplayName = strings.TrimSpace(req.DisplayName)
	req.Email = strings.TrimSpace(req.Email)

	if !usernameRe.MatchString(req.Username) {
		writeError(w, http.StatusBadRequest, "username: 3–32 символа, латиница/цифры/подчёркивание")
		return
	}
	if req.DisplayName == "" {
		req.DisplayName = req.Username
	}
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Не даём занимать username, если уже есть.
	if existing, _ := h.D.Users.GetByUsername(r.Context(), req.Username); existing != nil {
		writeError(w, http.StatusConflict, "username уже занят")
		return
	}

	u := &models.User{
		ID:           auth.NewUserID(),
		Username:     req.Username,
		DisplayName:  req.DisplayName,
		PasswordHash: &hash,
	}
	if req.Email != "" {
		u.Email = &req.Email
	}
	if err := h.D.Users.Create(r.Context(), u); err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось создать пользователя: "+err.Error())
		return
	}

	h.issueAndRespond(w, u)
}

type loginReq struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (h *AuthHandlers) Login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "невалидный JSON")
		return
	}
	u, err := h.D.Users.GetByUsername(r.Context(), strings.TrimSpace(req.Username))
	if err != nil || u.PasswordHash == nil {
		writeError(w, http.StatusUnauthorized, "неверные учётные данные")
		return
	}
	if err := auth.VerifyPassword(*u.PasswordHash, req.Password); err != nil {
		writeError(w, http.StatusUnauthorized, "неверные учётные данные")
		return
	}
	h.issueAndRespond(w, u)
}

func (h *AuthHandlers) Logout(w http.ResponseWriter, _ *http.Request) {
	auth.ClearCookie(w)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *AuthHandlers) Me(w http.ResponseWriter, r *http.Request) {
	id := auth.UserID(r.Context())
	if id == "" {
		writeError(w, http.StatusUnauthorized, "не авторизован")
		return
	}
	u, err := h.D.Users.GetByID(r.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			auth.ClearCookie(w)
			writeError(w, http.StatusUnauthorized, "пользователь не найден")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// TelegramLogin — endpoint для Telegram Login Widget.
// Принимает query- или JSON-параметры: id, first_name, last_name, username, photo_url, auth_date, hash.
// Если юзер по chat_id есть — логинит. Если нет — создаёт нового с полученным username.
func (h *AuthHandlers) TelegramLogin(w http.ResponseWriter, r *http.Request) {
	d, err := parseTelegramAuthData(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := auth.VerifyTelegramAuth(d, h.D.BotToken); err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	// Уже логинились через TG — берём существующего.
	if u, err := h.D.Users.GetByTelegramChatID(r.Context(), d.ID); err == nil {
		h.issueAndRespond(w, u)
		return
	}

	// Иначе создаём. Подбираем уникальный username.
	uname := d.Username
	if uname == "" {
		uname = "tg_" + strconv.FormatInt(d.ID, 10)
	}
	if !usernameRe.MatchString(uname) || h.usernameTaken(r, uname) {
		uname = "tg_" + strconv.FormatInt(d.ID, 10)
	}

	display := strings.TrimSpace(d.FirstName + " " + d.LastName)
	if display == "" {
		display = uname
	}

	tgUsername := d.Username
	avatarURL := d.PhotoURL

	u := &models.User{
		ID:               auth.NewUserID(),
		Username:         uname,
		DisplayName:      display,
		TelegramChatID:   &d.ID,
		TelegramUsername: nullable(tgUsername),
		AvatarURL:        nullable(avatarURL),
	}
	if err := h.D.Users.Create(r.Context(), u); err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось создать пользователя: "+err.Error())
		return
	}
	h.issueAndRespond(w, u)
}

// LinkTelegram — связывает уже залогиненного юзера с Telegram (через Login Widget).
func (h *AuthHandlers) LinkTelegram(w http.ResponseWriter, r *http.Request) {
	id := auth.UserID(r.Context())
	if id == "" {
		writeError(w, http.StatusUnauthorized, "не авторизован")
		return
	}
	d, err := parseTelegramAuthData(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := auth.VerifyTelegramAuth(d, h.D.BotToken); err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}
	if err := h.D.Users.LinkTelegram(r.Context(), id, d.ID, d.Username, d.PhotoURL); err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось связать TG: "+err.Error())
		return
	}
	u, err := h.D.Users.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, u)
}

// --- helpers ---

func (h *AuthHandlers) usernameTaken(r *http.Request, u string) bool {
	x, _ := h.D.Users.GetByUsername(r.Context(), u)
	return x != nil
}

func (h *AuthHandlers) issueAndRespond(w http.ResponseWriter, u *models.User) {
	tok, _, err := auth.IssueToken(h.D.Secret, u.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "не удалось выдать токен")
		return
	}
	auth.SetCookie(w, tok)
	writeJSON(w, http.StatusOK, u)
}

func parseTelegramAuthData(r *http.Request) (auth.TelegramAuthData, error) {
	var d auth.TelegramAuthData
	getStr := func(key string) string {
		return strings.TrimSpace(r.URL.Query().Get(key))
	}
	getInt := func(key string) int64 {
		v, _ := strconv.ParseInt(getStr(key), 10, 64)
		return v
	}

	d.ID = getInt("id")
	d.FirstName = getStr("first_name")
	d.LastName = getStr("last_name")
	d.Username = getStr("username")
	d.PhotoURL = getStr("photo_url")
	d.AuthDate = getInt("auth_date")
	d.Hash = getStr("hash")

	// Поддержим и JSON-body тоже.
	if d.ID == 0 && r.Body != nil {
		var body map[string]any
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			if v, ok := body["id"].(float64); ok {
				d.ID = int64(v)
			}
			d.FirstName = strOr(body, "first_name", d.FirstName)
			d.LastName = strOr(body, "last_name", d.LastName)
			d.Username = strOr(body, "username", d.Username)
			d.PhotoURL = strOr(body, "photo_url", d.PhotoURL)
			if v, ok := body["auth_date"].(float64); ok {
				d.AuthDate = int64(v)
			}
			d.Hash = strOr(body, "hash", d.Hash)
		}
	}

	if d.ID == 0 {
		return d, errors.New("отсутствует id Telegram-пользователя")
	}
	return d, nil
}

func strOr(m map[string]any, k, def string) string {
	if v, ok := m[k].(string); ok {
		return v
	}
	return def
}

func nullable(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
