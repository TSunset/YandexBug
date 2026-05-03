package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"time"
)

// TelegramAPI — минимальный клиент Bot API для нужд бэка.
type TelegramAPI struct {
	token  string
	client *http.Client
}

func NewTelegramAPI(token string) *TelegramAPI {
	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		TLSHandshakeTimeout:   10 * time.Second,
		ResponseHeaderTimeout: 30 * time.Second,
	}

	// Если задан SOCKS5_PROXY — маршрутизируем через него (нужен для обхода блокировок).
	if socksAddr := os.Getenv("SOCKS5_PROXY"); socksAddr != "" {
		if proxyURL, err := url.Parse(socksAddr); err == nil {
			transport.Proxy = http.ProxyURL(proxyURL)
		}
	}

	return &TelegramAPI{
		token: token,
		client: &http.Client{
			Timeout:   45 * time.Second,
			Transport: transport,
		},
	}
}

type LabeledPrice struct {
	Label  string `json:"label"`
	Amount int    `json:"amount"`
}

type createInvoiceLinkReq struct {
	Title         string         `json:"title"`
	Description   string         `json:"description"`
	Payload       string         `json:"payload"`
	ProviderToken string         `json:"provider_token"`
	Currency      string         `json:"currency"`
	Prices        []LabeledPrice `json:"prices"`
}

type tgResponse struct {
	OK          bool            `json:"ok"`
	Result      json.RawMessage `json:"result"`
	Description string          `json:"description"`
	ErrorCode   int             `json:"error_code"`
}

// CreateStarsInvoiceLink — создаёт ссылку на оплату звёздами.
// Для XTR (Telegram Stars) provider_token должен быть пустой строкой.
func (t *TelegramAPI) CreateStarsInvoiceLink(stars int, payload, title, description string) (string, error) {
	if t.token == "" {
		return "", errors.New("TELEGRAM_BOT_TOKEN не задан на бэке")
	}
	if stars < 1 {
		return "", errors.New("количество звёзд должно быть >= 1")
	}
	body := createInvoiceLinkReq{
		Title:         title,
		Description:   description,
		Payload:       payload,
		ProviderToken: "", // для Stars (XTR) — пусто
		Currency:      "XTR",
		Prices: []LabeledPrice{
			{Label: fmt.Sprintf("%d ⭐", stars), Amount: stars},
		},
	}
	raw, _ := json.Marshal(body)

	apiURL := fmt.Sprintf("https://api.telegram.org/bot%s/createInvoiceLink", t.token)
	req, _ := http.NewRequest(http.MethodPost, apiURL, bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")

	resp, err := t.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	var parsed tgResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		return "", fmt.Errorf("decode tg response: %w (body=%s)", err, string(respBody))
	}
	if !parsed.OK {
		return "", fmt.Errorf("telegram api: %s", parsed.Description)
	}

	var link string
	if err := json.Unmarshal(parsed.Result, &link); err != nil {
		return "", fmt.Errorf("invalid result: %w", err)
	}
	return link, nil
}
