package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const (
	tokenTTL    = 7 * 24 * time.Hour
	CookieName  = "yb_auth"
	bcryptCost  = 11
)

type Claims struct {
	UserID string `json:"sub"`
	jwt.RegisteredClaims
}

func HashPassword(password string) (string, error) {
	if len(password) < 6 {
		return "", errors.New("пароль слишком короткий (минимум 6 символов)")
	}
	h, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(h), nil
}

func VerifyPassword(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func IssueToken(secret []byte, userID string) (string, time.Time, error) {
	exp := time.Now().Add(tokenTTL)
	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tok.SignedString(secret)
	return signed, exp, err
}

func ParseToken(secret []byte, raw string) (*Claims, error) {
	tok, err := jwt.ParseWithClaims(raw, &Claims{}, func(t *jwt.Token) (any, error) {
		if t.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return secret, nil
	})
	if err != nil {
		return nil, err
	}
	c, ok := tok.Claims.(*Claims)
	if !ok || !tok.Valid {
		return nil, errors.New("invalid token")
	}
	return c, nil
}

// NewUserID — короткий случайный ID для users, inbox и пр.
func NewUserID() string {
	b := make([]byte, 12)
	_, _ = rand.Read(b)
	return "u_" + hex.EncodeToString(b)
}

func NewID(prefix string) string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return prefix + hex.EncodeToString(b)
}
