package auth

import (
	"context"
	"net/http"
	"strings"
)

type ctxKey string

const userCtxKey ctxKey = "user_id"

// Middleware — пытается извлечь user_id из cookie или заголовка Authorization.
// Не возвращает 401 — просто кладёт user_id в контекст, если токен валиден.
// Защита роута через RequireAuth.
func Middleware(secret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := tokenFromRequest(r)
			if raw != "" {
				if c, err := ParseToken(secret, raw); err == nil {
					r = r.WithContext(context.WithValue(r.Context(), userCtxKey, c.UserID))
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

// RequireAuth — гард для роутов, где обязателен авторизованный юзер.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if UserID(r.Context()) == "" {
			http.Error(w, `{"error":"требуется авторизация"}`, http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func UserID(ctx context.Context) string {
	v, _ := ctx.Value(userCtxKey).(string)
	return v
}

func tokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(CookieName); err == nil && c.Value != "" {
		return c.Value
	}
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(h, "Bearer ") {
		return strings.TrimPrefix(h, "Bearer ")
	}
	return ""
}

// SetCookie ставит httpOnly-cookie с JWT.
func SetCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		// В проде включить Secure: true (требует HTTPS).
		MaxAge: int(tokenTTL.Seconds()),
	})
}

func ClearCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
}
