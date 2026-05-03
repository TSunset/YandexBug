package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
)

// TelegramAuthData — поля от Telegram Login Widget.
// Поля приходят query-параметрами; hash считается на остальных.
type TelegramAuthData struct {
	ID        int64
	FirstName string
	LastName  string
	Username  string
	PhotoURL  string
	AuthDate  int64
	Hash      string
}

// VerifyTelegramAuth — проверяет HMAC-подпись данных от Telegram Login Widget.
// Алгоритм: secret = SHA256(bot_token); data_check_string = sorted "key=value\n..."
// без поля hash; ожидаемый hash = HMAC_SHA256(data_check_string, secret).
func VerifyTelegramAuth(d TelegramAuthData, botToken string) error {
	if botToken == "" {
		return errors.New("bot token не задан на сервере")
	}
	if d.Hash == "" {
		return errors.New("hash отсутствует")
	}
	if time.Since(time.Unix(d.AuthDate, 0)) > 24*time.Hour {
		return errors.New("auth_date устарел")
	}

	pairs := []string{}
	add := func(k, v string) {
		if v != "" {
			pairs = append(pairs, k+"="+v)
		}
	}
	add("auth_date", strconv.FormatInt(d.AuthDate, 10))
	add("first_name", d.FirstName)
	add("id", strconv.FormatInt(d.ID, 10))
	add("last_name", d.LastName)
	add("photo_url", d.PhotoURL)
	add("username", d.Username)
	sort.Strings(pairs)
	dataCheck := strings.Join(pairs, "\n")

	secretSum := sha256.Sum256([]byte(botToken))
	mac := hmac.New(sha256.New, secretSum[:])
	mac.Write([]byte(dataCheck))
	expected := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(expected), []byte(d.Hash)) {
		return fmt.Errorf("подпись Telegram не совпадает")
	}
	return nil
}
