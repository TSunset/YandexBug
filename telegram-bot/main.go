package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	tg "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

type Tariff struct {
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Description string   `json:"description"`
	Features    []string `json:"features"`
	IsPopular   bool     `json:"is_popular"`
}

type Bug struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Class string `json:"class"`
}

type Delivery struct {
	ID               string   `json:"id"`
	Message          string   `json:"message"`
	RecipientAddress string   `json:"recipient_address"`
	Tariff           string   `json:"tariff"`
	BugName          *string  `json:"bug_name,omitempty"`
	BugClass         *string  `json:"bug_class,omitempty"`
	Status           string   `json:"status"`
	ETAMinutes       int      `json:"eta_minutes"`
	Threats          []string `json:"threats"`
}

type sendState struct {
	step      int // 0=address, 1=message, 2=tariff
	recipient string
	message   string
}

var (
	backendURL string
	dialogs    = struct {
		sync.Mutex
		m map[int64]*sendState
	}{m: map[int64]*sendState{}}
)

func main() {
	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	backendURL = os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://backend:8080"
	}
	if token == "" || token == "put_your_token_here" {
		log.Println("[bot] TELEGRAM_BOT_TOKEN не задан — бот в режиме ожидания. Укажите токен в .env.")
		select {}
	}

	bot, err := tg.NewBotAPI(token)
	if err != nil {
		log.Fatalf("[bot] невалидный токен: %v", err)
	}
	bot.Debug = false
	log.Printf("[bot] авторизован как @%s, backend=%s", bot.Self.UserName, backendURL)

	_, _ = bot.Request(tg.NewSetMyCommands(
		tg.BotCommand{Command: "start", Description: "Приветствие"},
		tg.BotCommand{Command: "send", Description: "Отправить сообщение тараканом"},
		tg.BotCommand{Command: "tariffs", Description: "Тарифы"},
		tg.BotCommand{Command: "status", Description: "Статус доставки по ID"},
		tg.BotCommand{Command: "bug", Description: "Случайный таракан-курьер"},
		tg.BotCommand{Command: "help", Description: "Список команд"},
	))

	upd := tg.NewUpdate(0)
	upd.Timeout = 30
	updates := bot.GetUpdatesChan(upd)

	for u := range updates {
		if u.Message == nil {
			continue
		}
		go handle(bot, u.Message)
	}
}

func handle(bot *tg.BotAPI, m *tg.Message) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[bot] panic: %v", r)
		}
	}()

	chatID := m.Chat.ID
	text := strings.TrimSpace(m.Text)

	dialogs.Lock()
	st := dialogs.m[chatID]
	dialogs.Unlock()

	if m.IsCommand() {
		if st != nil {
			dialogs.Lock()
			delete(dialogs.m, chatID)
			dialogs.Unlock()
		}
		switch m.Command() {
		case "start":
			reply(bot, chatID, startText(), nil)
		case "help":
			reply(bot, chatID, helpText(), nil)
		case "tariffs":
			handleTariffs(bot, chatID)
		case "send":
			dialogs.Lock()
			dialogs.m[chatID] = &sendState{step: 0}
			dialogs.Unlock()
			reply(bot, chatID, "Куда доставить сообщение? Напишите адрес одним сообщением.\n\nЧтобы отменить, отправьте /cancel.", nil)
		case "status":
			args := strings.TrimSpace(m.CommandArguments())
			if args == "" {
				reply(bot, chatID, "Использование: /status DEL-XXXXXX", nil)
				return
			}
			handleStatus(bot, chatID, args)
		case "bug":
			handleBug(bot, chatID)
		case "cancel":
			reply(bot, chatID, "Окей, отменил.", nil)
		default:
			reply(bot, chatID, "Не знаю такой команды. /help в помощь.", nil)
		}
		return
	}

	if st != nil {
		handleSendDialog(bot, chatID, st, text)
		return
	}

	reply(bot, chatID, "Я понимаю команды. Попробуйте /send или /help.", nil)
}

func handleSendDialog(bot *tg.BotAPI, chatID int64, st *sendState, text string) {
	switch st.step {
	case 0:
		if text == "" {
			reply(bot, chatID, "Адрес пустой. Попробуйте ещё раз.", nil)
			return
		}
		st.recipient = text
		st.step = 1
		reply(bot, chatID, "Что передать? (до 256 символов)", nil)
	case 1:
		if text == "" {
			reply(bot, chatID, "Сообщение пустое. Напишите текст.", nil)
			return
		}
		if len([]rune(text)) > 256 {
			reply(bot, chatID, "Слишком длинно. Тараканы носят максимум 256 символов.", nil)
			return
		}
		st.message = text
		st.step = 2
		kb := tg.NewReplyKeyboard(
			tg.NewKeyboardButtonRow(tg.NewKeyboardButton("Bug Free"), tg.NewKeyboardButton("Bug Plus")),
			tg.NewKeyboardButtonRow(tg.NewKeyboardButton("Bug Pro"), tg.NewKeyboardButton("Bug Business")),
			tg.NewKeyboardButtonRow(tg.NewKeyboardButton("Bug Ultra")),
		)
		kb.OneTimeKeyboard = true
		kb.ResizeKeyboard = true
		reply(bot, chatID, "Выберите тариф:", &kb)
	case 2:
		code := tariffCodeByName(text)
		if code == "" {
			reply(bot, chatID, "Не понял тариф. Выберите из списка кнопок.", nil)
			return
		}
		dialogs.Lock()
		delete(dialogs.m, chatID)
		dialogs.Unlock()

		body := map[string]any{
			"recipient_address": st.recipient,
			"message":           st.message,
			"tariff":            code,
			"notify_channel":    "telegram",
			"telegram_chat_id":  chatID,
		}
		var d Delivery
		if err := apiPost("/deliveries", body, &d); err != nil {
			reply(bot, chatID, "Ошибка отправки: "+err.Error(), removeKb())
			return
		}
		reply(bot, chatID, formatDelivery(&d, true), removeKb())
	}
}

func handleTariffs(bot *tg.BotAPI, chatID int64) {
	var ts []Tariff
	if err := apiGet("/tariffs", &ts); err != nil {
		reply(bot, chatID, "Не получилось загрузить тарифы: "+err.Error(), nil)
		return
	}
	var b strings.Builder
	b.WriteString("Тарифы YandexBug:\n\n")
	for _, t := range ts {
		star := ""
		if t.IsPopular {
			star = " ⭐"
		}
		fmt.Fprintf(&b, "*%s*%s — %d ₽\n_%s_\n", t.Name, star, t.Price, t.Description)
		for _, f := range t.Features {
			fmt.Fprintf(&b, "• %s\n", f)
		}
		b.WriteString("\n")
	}
	msg := tg.NewMessage(chatID, b.String())
	msg.ParseMode = tg.ModeMarkdown
	_, _ = bot.Send(msg)
}

func handleStatus(bot *tg.BotAPI, chatID int64, id string) {
	var d Delivery
	if err := apiGet("/deliveries/"+id, &d); err != nil {
		reply(bot, chatID, "Не нашёл доставку "+id+": "+err.Error(), nil)
		return
	}
	reply(bot, chatID, formatDelivery(&d, false), nil)
}

func handleBug(bot *tg.BotAPI, chatID int64) {
	var bugs []Bug
	if err := apiGet("/bugs", &bugs); err != nil || len(bugs) == 0 {
		reply(bot, chatID, "Все тараканы спрятались. Попробуйте позже.", nil)
		return
	}
	b := bugs[time.Now().UnixNano()%int64(len(bugs))]
	reply(bot, chatID, fmt.Sprintf("Сегодня дежурит:\n\n🪳 %s\nКласс: %s", b.Name, b.Class), nil)
}

func startText() string {
	return `Привет! Это YandexBug — офлайн-доставка сообщений тараканами.

Таракан жив, даже если интернет мертв.

Команды:
/send — отправить сообщение
/tariffs — посмотреть тарифы
/status DEL-XXXXXX — узнать статус
/bug — случайный курьер
/help — все команды`
}

func helpText() string {
	return `Команды:
/start — приветствие
/send — пошагово отправить сообщение
/tariffs — список тарифов
/status DEL-XXXXXX — статус доставки
/bug — случайный таракан
/cancel — прервать диалог
/help — эта справка`
}

func formatDelivery(d *Delivery, isNew bool) string {
	var b strings.Builder
	if isNew {
		b.WriteString("✅ Сообщение принято.\n\n")
	} else {
		b.WriteString("📦 Статус доставки\n\n")
	}
	fmt.Fprintf(&b, "ID: %s\n", d.ID)
	if d.BugName != nil && d.BugClass != nil {
		fmt.Fprintf(&b, "Курьер: %s\nКласс: %s\n", *d.BugName, *d.BugClass)
	}
	fmt.Fprintf(&b, "Тариф: %s\nСтатус: %s\nETA: %d мин\n", d.Tariff, d.Status, d.ETAMinutes)
	if len(d.Threats) > 0 {
		fmt.Fprintf(&b, "Угрозы: %s\n", strings.Join(d.Threats, ", "))
	}
	if isNew {
		b.WriteString("\nПроверить статус позже: /status " + d.ID)
		b.WriteString("\n\nТаракан жив, даже если интернет мертв.")
	}
	return b.String()
}

func tariffCodeByName(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "bug free":
		return "bug_free"
	case "bug plus":
		return "bug_plus"
	case "bug pro":
		return "bug_pro"
	case "bug business":
		return "bug_business"
	case "bug ultra":
		return "bug_ultra"
	}
	return ""
}

func reply(bot *tg.BotAPI, chatID int64, text string, kb any) {
	msg := tg.NewMessage(chatID, text)
	if kb != nil {
		msg.ReplyMarkup = kb
	}
	if _, err := bot.Send(msg); err != nil {
		log.Printf("[bot] send: %v", err)
	}
}

func removeKb() *tg.ReplyKeyboardRemove {
	r := tg.NewRemoveKeyboard(true)
	return &r
}

func apiGet(path string, out any) error {
	resp, err := http.Get(backendURL + path)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}
	return json.Unmarshal(body, out)
}

func apiPost(path string, payload any, out any) error {
	raw, _ := json.Marshal(payload)
	resp, err := http.Post(backendURL+path, "application/json", bytes.NewReader(raw))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(body))
	}
	if out != nil {
		return json.Unmarshal(body, out)
	}
	return nil
}
