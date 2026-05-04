package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	tg "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"golang.org/x/net/proxy"
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

type TelegramUser struct {
	ChatID    int64   `json:"chat_id"`
	Username  *string `json:"username,omitempty"`
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
}

// Шаги диалога /send:
// 0 — спрашиваем @username получателя
// 1 — спрашиваем текст сообщения
// 2 — спрашиваем тариф
type sendState struct {
	step             int
	recipientChatID  int64
	recipientHandle  string // как ввёл пользователь, для отображения
	recipientName    string // имя получателя для красоты
	message          string
}

var (
	backendURL string
	dialogs    = struct {
		sync.Mutex
		m map[int64]*sendState
	}{m: map[int64]*sendState{}}
)

func main() {
	rand.Seed(time.Now().UnixNano())

	token := os.Getenv("TELEGRAM_BOT_TOKEN")
	backendURL = os.Getenv("BACKEND_URL")
	if backendURL == "" {
		backendURL = "http://backend:8080"
	}
	if isPlaceholderToken(token) {
		log.Println("[bot] TELEGRAM_BOT_TOKEN не задан — бот в режиме ожидания. Укажите токен в .env.")
		waitForever()
	}

	// Если задан SOCKS5_PROXY — используем его (напр. "socks5://127.0.0.1:9050" для Tor)
	var (
		bot *tg.BotAPI
		err error
	)
	if socksAddr := os.Getenv("SOCKS5_PROXY"); socksAddr != "" {
		socksAddr = strings.TrimPrefix(socksAddr, "socks5://")
		dialer, dialErr := proxy.SOCKS5("tcp", socksAddr, nil, proxy.Direct)
		if dialErr != nil {
			log.Fatalf("[bot] не удалось создать SOCKS5 dialer: %v", dialErr)
		}
		httpClient := &http.Client{
			Transport: &http.Transport{
				DialContext: func(_ context.Context, network, addr string) (net.Conn, error) {
					return dialer.Dial(network, addr)
				},
			},
			// Timeout не ставим — long-polling для getUpdates занимает до 60 сек
		}
		bot, err = tg.NewBotAPIWithClient(token, tg.APIEndpoint, httpClient)
		log.Printf("[bot] использую SOCKS5 прокси: %s", socksAddr)
	} else {
		bot, err = tg.NewBotAPI(token)
	}
	if err != nil {
		log.Fatalf("[bot] невалидный токен или нет соединения: %v", err)
	}
	bot.Debug = false
	log.Printf("[bot] авторизован как @%s, backend=%s", bot.Self.UserName, backendURL)

	_, _ = bot.Request(tg.NewSetMyCommands(
		tg.BotCommand{Command: "start", Description: "Приветствие и регистрация"},
		tg.BotCommand{Command: "send", Description: "Отправить сообщение тараканом"},
		tg.BotCommand{Command: "tariffs", Description: "Тарифы"},
		tg.BotCommand{Command: "status", Description: "Статус доставки по ID"},
		tg.BotCommand{Command: "bug", Description: "Случайный таракан-курьер"},
		tg.BotCommand{Command: "donate", Description: "Поддержать звёздами ⭐"},
		tg.BotCommand{Command: "author", Description: "Автор идеи"},
		tg.BotCommand{Command: "whoami", Description: "Кто я для бота"},
		tg.BotCommand{Command: "help", Description: "Список команд"},
	))

	// Запускаем фоновый воркер: тянет уведомления из backend и отправляет их.
	go pendingWorker(bot)

	upd := tg.NewUpdate(0)
	upd.Timeout = 30
	updates := bot.GetUpdatesChan(upd)

	for u := range updates {
		// Платежи: pre_checkout_query (нужно ответить за 10 сек!) и successful_payment.
		if u.PreCheckoutQuery != nil {
			go handlePreCheckout(bot, u.PreCheckoutQuery)
			continue
		}
		if u.Message != nil && u.Message.SuccessfulPayment != nil {
			go handleSuccessfulPayment(bot, u.Message)
			continue
		}
		if u.CallbackQuery != nil {
			go handleCallback(bot, u.CallbackQuery)
			continue
		}
		if u.Message == nil {
			continue
		}
		go handle(bot, u.Message)
	}
}

// handleCallback — нажатия на inline-кнопки. Используем для пресетов донатов.
func handleCallback(bot *tg.BotAPI, q *tg.CallbackQuery) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[bot] callback panic: %v", r)
		}
	}()
	_, _ = bot.Request(tg.NewCallback(q.ID, ""))
	if strings.HasPrefix(q.Data, "donate:") {
		n, err := strconv.Atoi(strings.TrimPrefix(q.Data, "donate:"))
		if err != nil || n < 1 {
			return
		}
		sendDonateInvoice(bot, q.Message.Chat.ID, n)
	}
}

// handlePreCheckout — Telegram присылает этот апдейт перед списанием звёзд.
// Должны ответить ok=true за 10 сек, иначе платёж откатится.
func handlePreCheckout(bot *tg.BotAPI, q *tg.PreCheckoutQuery) {
	cfg := tg.PreCheckoutConfig{
		PreCheckoutQueryID: q.ID,
		OK:                 true,
	}
	if _, err := bot.Request(cfg); err != nil {
		log.Printf("[bot] precheckout answer: %v", err)
	}
}

// handleSuccessfulPayment — пришло событие успешной оплаты.
// Дёргаем бэк чтобы отметить донат как paid.
func handleSuccessfulPayment(bot *tg.BotAPI, m *tg.Message) {
	sp := m.SuccessfulPayment
	if sp == nil {
		return
	}
	body := map[string]any{
		"provider_charge_id": sp.ProviderPaymentChargeID,
		"telegram_chat_id":   m.Chat.ID,
	}
	if err := apiPost("/internal/donations/"+sp.InvoicePayload+"/paid", body, nil); err != nil {
		log.Printf("[bot] mark paid: %v", err)
	}
	reply(bot, m.Chat.ID, fmt.Sprintf(
		"✨ Спасибо за поддержку! Получено %d ⭐.\n"+
			"Ваш статус: <b>Спонсор</b>. Тараканы благодарны.",
		sp.TotalAmount), nil)
	// HTML mode для предыдущего сообщения нужен через msg.ParseMode — упростим:
	// (reply без HTML тоже норм; теги просто покажутся как есть, но визуально терпимо)
}

type pendingItem struct {
	ID         string  `json:"id"`
	ChatID     int64   `json:"chat_id"`
	Text       string  `json:"text"`
	ParseMode  string  `json:"parse_mode"`
	DeliveryID *string `json:"delivery_id,omitempty"`
}

// pendingWorker — раз в 3 сек обращается к /internal/telegram/pending,
// получает порцию уведомлений, отправляет их в Telegram, помечает как sent.
func pendingWorker(bot *tg.BotAPI) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[bot] pending worker panic: %v", r)
		}
	}()
	t := time.NewTicker(3 * time.Second)
	defer t.Stop()
	for range t.C {
		var items []pendingItem
		if err := apiGet("/internal/telegram/pending?limit=10", &items); err != nil {
			continue
		}
		for _, it := range items {
			msg := tg.NewMessage(it.ChatID, it.Text)
			if it.ParseMode != "" {
				msg.ParseMode = it.ParseMode
			}
			if _, err := bot.Send(msg); err != nil {
				log.Printf("[bot] send pending %s: %v", it.ID, err)
				_ = apiPost("/internal/telegram/pending/"+it.ID+"/release", nil, nil)
				continue
			}
			_ = apiPost("/internal/telegram/pending/"+it.ID+"/sent", nil, nil)
		}
	}
}

func isPlaceholderToken(token string) bool {
	switch strings.TrimSpace(token) {
	case "", "put_your_token_here", "REPLACE_WITH_YOUR_TOKEN":
		return true
	default:
		return false
	}
}

func waitForever() {
	for {
		time.Sleep(24 * time.Hour)
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

	// Любое взаимодействие — апсертим пользователя в базу,
	// чтобы потом находили его по @username для отправки.
	go registerUser(m.From, chatID)

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
			reply(bot, chatID, startText(m.From), nil)
		case "help":
			reply(bot, chatID, helpText(), nil)
		case "tariffs":
			handleTariffs(bot, chatID)
		case "send":
			dialogs.Lock()
			dialogs.m[chatID] = &sendState{step: 0}
			dialogs.Unlock()
			reply(bot, chatID,
				"Кому доставить? Пришлите @username получателя.\n\n"+
					"⚠️ Получатель должен сначала запустить этого бота сам (нажать /start),"+
					" иначе таракан не найдёт куда лететь.\n\n"+
					"Или напишите «себе» — отправлю вам же для теста.\n\n"+
					"Чтобы отменить — /cancel.", nil)
		case "status":
			args := strings.TrimSpace(m.CommandArguments())
			if args == "" {
				reply(bot, chatID, "Использование: /status DEL-XXXXXX", nil)
				return
			}
			handleStatus(bot, chatID, args)
		case "bug":
			handleBug(bot, chatID)
		case "donate":
			handleDonate(bot, chatID, m.CommandArguments())
		case "author":
			handleAuthor(bot, m.From, chatID)
		case "whoami":
			handleWhoami(bot, m.From, chatID)
		case "cancel":
			reply(bot, chatID, "Окей, отменил.", nil)
		default:
			reply(bot, chatID, "Не знаю такой команды. /help в помощь.", nil)
		}
		return
	}

	if st != nil {
		handleSendDialog(bot, m.From, chatID, st, text)
		return
	}

	reply(bot, chatID, "Я понимаю команды. Попробуйте /send или /help.", nil)
}

func handleSendDialog(bot *tg.BotAPI, from *tg.User, senderChatID int64, st *sendState, text string) {
	switch st.step {
	case 0:
		if text == "" {
			reply(bot, senderChatID, "Пусто. Напишите @username получателя или «себе».", nil)
			return
		}
		// Спецслучай — отправка самому себе (для теста).
		if isSelfKeyword(text) {
			st.recipientChatID = senderChatID
			st.recipientHandle = "вы сами"
			st.recipientName = displayName(from)
			st.step = 1
			reply(bot, senderChatID, "Хорошо, доставлю вам же. Что передать? (до 256 символов)", nil)
			return
		}
		username := strings.TrimPrefix(strings.TrimSpace(text), "@")
		if username == "" {
			reply(bot, senderChatID, "Пришлите @username получателя.", nil)
			return
		}
		u, err := lookupUser(username)
		if err != nil {
			reply(bot, senderChatID, fmt.Sprintf(
				"Не нашёл @%s среди тех, кто запускал бота.\n\n"+
					"Попросите получателя открыть бота и нажать /start, потом попробуйте снова.\n\n"+
					"Или напишите «себе» для теста.", username), nil)
			return
		}
		st.recipientChatID = u.ChatID
		st.recipientHandle = "@" + username
		if u.FirstName != nil {
			st.recipientName = *u.FirstName
		} else {
			st.recipientName = "@" + username
		}
		st.step = 1
		reply(bot, senderChatID, fmt.Sprintf("Отправляем %s. Что передать? (до 256 символов)", st.recipientHandle), nil)

	case 1:
		if text == "" {
			reply(bot, senderChatID, "Сообщение пустое. Напишите текст.", nil)
			return
		}
		if len([]rune(text)) > 256 {
			reply(bot, senderChatID, "Слишком длинно. Тараканы носят максимум 256 символов.", nil)
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
		reply(bot, senderChatID, "Выберите тариф:", &kb)

	case 2:
		code := tariffCodeByName(text)
		if code == "" {
			reply(bot, senderChatID, "Не понял тариф. Выберите из списка кнопок.", nil)
			return
		}
		dialogs.Lock()
		delete(dialogs.m, senderChatID)
		dialogs.Unlock()

		// Создаём заказ в backend — для статусов, истории и трекинга.
		body := map[string]any{
			"recipient_address": st.recipientHandle,
			"message":           st.message,
			"tariff":            code,
			"sender_name":       displayName(from),
			"notify_channel":    "telegram",
			"telegram_chat_id":  senderChatID,
		}
		var d Delivery
		if err := apiPost("/deliveries", body, &d); err != nil {
			reply(bot, senderChatID, "Ошибка отправки: "+err.Error(), removeKb())
			return
		}

		// Снимаем клавиатуру с тарифами одним служебным сообщением.
		ack := tg.NewMessage(senderChatID, fmt.Sprintf("Заказ принят: %s. Запускаю таракана…", d.ID))
		ack.ReplyMarkup = removeKb()
		_, _ = bot.Send(ack)

		// Запускаем анимированную доставку. Длительность 30–60 сек.
		totalSec := 30 + rand.Intn(31)
		go animateDelivery(bot, animateInput{
			SenderChatID:    senderChatID,
			RecipientChatID: st.recipientChatID,
			SenderName:      displayName(from),
			RecipientName:   st.recipientName,
			RecipientHandle: st.recipientHandle,
			Message:         st.message,
			DeliveryID:      d.ID,
			BugName:         derefOr(d.BugName, "Геннадий"),
			BugClass:        derefOr(d.BugClass, "Flyer"),
			Tariff:          d.Tariff,
			TotalSeconds:    totalSec,
		})
	}
}

type animateInput struct {
	SenderChatID    int64
	RecipientChatID int64
	SenderName      string
	RecipientName   string
	RecipientHandle string
	Message         string
	DeliveryID      string
	BugName         string
	BugClass        string
	Tariff          string
	TotalSeconds    int
}

// stage — один шаг анимации полёта таракана.
type stage struct {
	emoji  string
	status string
	label  string
}

var flightStages = []stage{
	{"📦", "PACKED", "Письмо упаковано"},
	{"🪳", "BUG_ASSIGNED", "Назначен курьер"},
	{"🛫", "TAKEOFF", "Таракан вылетел"},
	{"💨", "IN_ROUTE", "В пути"},
	{"⚠️", "OBSTACLE", "Маневрирует среди угроз"},
	{"🏃", "RECOVER", "Обошёл препятствие"},
	{"🎯", "APPROACHING", "Подлетает к адресату"},
	{"📬", "ARRIVED", "Доставка"},
}

// animateDelivery — рисует анимированный прогресс доставки одним редактируемым сообщением
// в чатах отправителя и получателя. В конце финализирует — ✅ или 💀 с текстом сообщения.
func animateDelivery(bot *tg.BotAPI, in animateInput) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[bot] animate panic: %v", r)
		}
	}()

	// Фиксированная вероятность доставки 70% (30% смертность) — одинаково для всех тарифов.
	successRate := float32(0.70)

	// Отправляем стартовые сообщения отправителю и получателю.
	senderHeader := fmt.Sprintf(
		"<b>📦 Доставка %s</b>\n"+
			"Кому: %s\n"+
			"Курьер: %s (%s)\n"+
			"Тариф: %s",
		in.DeliveryID, htmlEscape(in.RecipientHandle),
		htmlEscape(in.BugName), htmlEscape(in.BugClass), in.Tariff,
	)
	recipientHeader := fmt.Sprintf(
		"<b>📬 К вам летит таракан!</b>\n"+
			"От: %s\n"+
			"Курьер: %s (%s)\n"+
			"ID: %s",
		htmlEscape(in.SenderName),
		htmlEscape(in.BugName), htmlEscape(in.BugClass), in.DeliveryID,
	)

	senderMsgID, ok := sendInitial(bot, in.SenderChatID, senderHeader+"\n\n"+renderProgress(0, flightStages[0]))
	if !ok {
		return
	}
	var recipientMsgID int
	recipientOK := false
	if in.RecipientChatID != 0 && in.RecipientChatID != in.SenderChatID {
		recipientMsgID, recipientOK = sendInitial(bot, in.RecipientChatID, recipientHeader+"\n\n"+renderProgress(0, flightStages[0]))
	}

	steps := len(flightStages)
	stepDelay := time.Duration(in.TotalSeconds) * time.Second / time.Duration(steps)
	// Минимум 4 секунды между правками — Telegram режет частые edit'ы и они "дёргаются".
	if stepDelay < 4*time.Second {
		stepDelay = 4 * time.Second
	}

	// Идём по стадиям. На каждой стадии — пауза + редактирование сообщения.
	for i, st := range flightStages {
		time.Sleep(stepDelay)

		percent := int(float64(i+1) / float64(steps) * 100)
		bar := renderProgressDetailed(percent, st)

		editText(bot, in.SenderChatID, senderMsgID, senderHeader+"\n\n"+bar)
		if recipientOK {
			editText(bot, in.RecipientChatID, recipientMsgID, recipientHeader+"\n\n"+bar)
		}
	}

	// Финализируем результат.
	success := rand.Float32() < successRate

	if success {
		// Отправитель — успех.
		senderFinal := fmt.Sprintf(
			"%s\n\n"+
				"<b>✅ ДОСТАВЛЕНО</b>\n"+
				"%s\n\n"+
				"<b>💌 Сообщение, которое получил адресат:</b>\n%s\n\n"+
				"<i>Таракан жив, даже если интернет мертв.</i>",
			senderHeader, renderFullBar(), htmlEscape(in.Message),
		)
		editText(bot, in.SenderChatID, senderMsgID, senderFinal)

		if recipientOK {
			recipientFinal := fmt.Sprintf(
				"%s\n\n"+
					"<b>✅ ДОСТАВЛЕНО</b>\n"+
					"%s\n\n"+
					"<b>💌 Сообщение для вас:</b>\n%s\n\n"+
					"<i>Передал: %s. Таракан жив, даже если интернет мертв.</i>",
				recipientHeader, renderFullBar(),
				htmlEscape(in.Message), htmlEscape(in.SenderName),
			)
			editText(bot, in.RecipientChatID, recipientMsgID, recipientFinal)
		}
	} else {
		// Неудача — таракан погиб / съеден / провал.
		fail := pickFailure()
		failMsg := fmt.Sprintf(
			"%s\n\n"+
				"<b>%s</b>\n"+
				"%s\n\n"+
				"<i>Сообщение не доставлено. Можно попробовать тариф повыше.</i>",
			senderHeader, fail, renderFailedBar(),
		)
		editText(bot, in.SenderChatID, senderMsgID, failMsg)
		if recipientOK {
			editText(bot, in.RecipientChatID, recipientMsgID, fmt.Sprintf(
				"%s\n\n<b>💀 Курьер не долетел до вас.</b>\n%s",
				recipientHeader, renderFailedBar(),
			))
		}
	}
}

// renderProgress — короткий вид для стартовой стадии.
func renderProgress(percent int, st stage) string {
	return renderProgressDetailed(percent, st)
}

// renderProgressDetailed — рисует полоску, эмодзи-таракана на её позиции и подпись.
func renderProgressDetailed(percent int, st stage) string {
	const totalSlots = 12
	filled := percent * totalSlots / 100
	if filled > totalSlots {
		filled = totalSlots
	}
	if filled < 0 {
		filled = 0
	}

	// Полоска: от старта до позиции таракана — заполнено, дальше — пусто.
	var bar strings.Builder
	bar.WriteString("🏠")
	for i := 0; i < totalSlots; i++ {
		switch {
		case i < filled-1:
			bar.WriteString("▰")
		case i == filled-1 || (filled == 0 && i == 0):
			bar.WriteString("🪳") // таракан-курьер летит
		default:
			bar.WriteString("▱")
		}
	}
	bar.WriteString("📭")

	return fmt.Sprintf(
		"%s  %s\n<b>%s%%</b> · %s",
		st.emoji, htmlEscape(st.label), padPct(percent), st.status,
	) + "\n" + bar.String()
}

func renderFullBar() string {
	return "🏠▰▰▰▰▰▰▰▰▰▰▰✅📬"
}

func renderFailedBar() string {
	return "🏠▰▰▰▰💀▱▱▱▱▱▱▱📭"
}

func padPct(p int) string {
	if p < 10 {
		return "  " + strconv.Itoa(p)
	}
	if p < 100 {
		return " " + strconv.Itoa(p)
	}
	return strconv.Itoa(p)
}

func pickFailure() string {
	options := []string{
		"💀 Миссия провалена — таракан потерян",
		"🐱 Курьер съеден котом",
		"🦸 Таракан погиб геройски, выполнив часть миссии",
	}
	return options[rand.Intn(len(options))]
}

func sendInitial(bot *tg.BotAPI, chatID int64, text string) (int, bool) {
	msg := tg.NewMessage(chatID, text)
	msg.ParseMode = tg.ModeHTML
	sent, err := bot.Send(msg)
	if err != nil {
		log.Printf("[bot] send initial: %v", err)
		return 0, false
	}
	return sent.MessageID, true
}

func editText(bot *tg.BotAPI, chatID int64, msgID int, text string) {
	if msgID == 0 {
		return
	}
	edit := tg.NewEditMessageText(chatID, msgID, text)
	edit.ParseMode = tg.ModeHTML
	if _, err := bot.Request(edit); err != nil {
		// Игнорируем "message is not modified" — это норма.
		if !strings.Contains(err.Error(), "not modified") {
			log.Printf("[bot] edit: %v", err)
		}
	}
}

func derefOr(s *string, def string) string {
	if s == nil || *s == "" {
		return def
	}
	return *s
}

func handleTariffs(bot *tg.BotAPI, chatID int64) {
	var ts []Tariff
	if err := apiGet("/tariffs", &ts); err != nil {
		reply(bot, chatID, "Не получилось загрузить тарифы: "+err.Error(), nil)
		return
	}
	var b strings.Builder
	b.WriteString("<b>Тарифы YandexBug</b>\n\n")
	for _, t := range ts {
		star := ""
		if t.IsPopular {
			star = " ⭐"
		}
		priceStr := fmt.Sprintf("%d ₽", t.Price)
		if t.Price == 0 {
			priceStr = "бесплатно"
		}
		fmt.Fprintf(&b, "<b>%s</b>%s — %s\n<i>%s</i>\n", htmlEscape(t.Name), star, priceStr, htmlEscape(t.Description))
		for _, f := range t.Features {
			fmt.Fprintf(&b, "• %s\n", htmlEscape(f))
		}
		b.WriteString("\n")
	}
	msg := tg.NewMessage(chatID, b.String())
	msg.ParseMode = tg.ModeHTML
	if _, err := bot.Send(msg); err != nil {
		log.Printf("[bot] tariffs send: %v", err)
		// Fallback: plain text без разметки.
		plain := strings.NewReplacer("<b>", "", "</b>", "", "<i>", "", "</i>", "").Replace(b.String())
		_, _ = bot.Send(tg.NewMessage(chatID, plain))
	}
}

func htmlEscape(s string) string {
	r := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")
	return r.Replace(s)
}

func handleStatus(bot *tg.BotAPI, chatID int64, id string) {
	var d Delivery
	if err := apiGet("/deliveries/"+id, &d); err != nil {
		reply(bot, chatID, "Не нашёл доставку "+id+": "+err.Error(), nil)
		return
	}
	reply(bot, chatID, formatDelivery(&d, false), nil)
}

type createInvoiceResp struct {
	InvoiceURL string `json:"invoice_url"`
	Payload    string `json:"payload"`
	Stars      int    `json:"stars"`
}

// handleDonate — /donate [N], либо без аргумента → клавиатура с пресетами и slider-URL.
// Backend создаёт invoice link и мы шлём его кнопкой.
func handleDonate(bot *tg.BotAPI, chatID int64, arg string) {
	stars := 0
	if arg != "" {
		if n, err := strconv.Atoi(strings.TrimSpace(arg)); err == nil && n >= 1 && n <= 10000 {
			stars = n
		}
	}
	if stars == 0 {
		// Предлагаем пресеты как inline-кнопки.
		text := "💛 Поддержите YandexBug звёздами.\n\n" +
			"Звёзды идут на корм тараканам, обновление парка тапко-датчиков и зарплату Геннадию.\n\n" +
			"Выберите пакет или введите своё число:\n/donate 100"
		kb := tg.NewInlineKeyboardMarkup(
			tg.NewInlineKeyboardRow(
				tg.NewInlineKeyboardButtonData("50 ⭐", "donate:50"),
				tg.NewInlineKeyboardButtonData("200 ⭐", "donate:200"),
				tg.NewInlineKeyboardButtonData("1000 ⭐", "donate:1000"),
			),
		)
		msg := tg.NewMessage(chatID, text)
		msg.ReplyMarkup = kb
		_, _ = bot.Send(msg)
		return
	}
	sendDonateInvoice(bot, chatID, stars)
}

func sendDonateInvoice(bot *tg.BotAPI, chatID int64, stars int) {
	body := map[string]any{"stars": stars}
	var resp createInvoiceResp
	if err := apiPost("/donations/create-invoice", body, &resp); err != nil {
		reply(bot, chatID, "Не получилось создать счёт: "+err.Error(), nil)
		return
	}
	text := fmt.Sprintf("Счёт на %d ⭐ готов. Нажмите кнопку для оплаты:", stars)
	kb := tg.NewInlineKeyboardMarkup(
		tg.NewInlineKeyboardRow(
			tg.NewInlineKeyboardButtonURL(fmt.Sprintf("Оплатить %d ⭐", stars), resp.InvoiceURL),
		),
	)
	msg := tg.NewMessage(chatID, text)
	msg.ReplyMarkup = kb
	_, _ = bot.Send(msg)
}

// handleAuthor — отправляет фото автора идеи с подписью.
// Доступно только для @disc0uraged и @TSun_set.
func handleAuthor(bot *tg.BotAPI, from *tg.User, chatID int64) {
	authorAllowed := []string{"disc0uraged", "TSun_set"}
	username := ""
	if from != nil {
		username = from.UserName
	}
	allowed := false
	for _, u := range authorAllowed {
		if strings.EqualFold(u, username) {
			allowed = true
			break
		}
	}
	if !allowed {
		reply(bot, chatID, "❌ Нет доступа к этой команде.", nil)
		return
	}
	photo := tg.NewPhoto(chatID, tg.FilePath("/app/static/varya.jpg"))
	photo.Caption = "Варя ❤️"
	if _, err := bot.Send(photo); err != nil {
		log.Printf("[bot] author photo: %v", err)
		reply(bot, chatID, "Варя ❤️", nil)
	}
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

func handleWhoami(bot *tg.BotAPI, from *tg.User, chatID int64) {
	un := "не задан"
	if from != nil && from.UserName != "" {
		un = "@" + from.UserName
	}
	msg := fmt.Sprintf("chat_id: %d\nusername: %s\n\n", chatID, un)
	if from != nil && from.UserName == "" {
		msg += "⚠️ У вас не задан username в Telegram. Без него вам нельзя отправить сообщение от другого пользователя.\n" +
			"Включите его в Telegram → Настройки → Username."
	} else {
		msg += "Готово. Друзья могут писать вам через бота, указав ваш username."
	}
	reply(bot, chatID, msg, nil)
}

func startText(from *tg.User) string {
	name := displayName(from)
	return fmt.Sprintf(`Привет, %s! Это YandexBug — офлайн-доставка сообщений тараканами.

Таракан жив, даже если интернет мертв.

Я зарегистрировал вас в системе. Теперь друзья могут отправить вам сообщение через таракана,
указав ваш @username.

Команды:
/send — отправить сообщение
/tariffs — посмотреть тарифы
/status DEL-XXXXXX — узнать статус
/bug — случайный курьер
/donate — поддержать звёздами ⭐
/author — автор идеи
/whoami — кто я для бота
/help — все команды`, name)
}

func helpText() string {
	return `Команды:
/start — приветствие и регистрация
/send — пошагово отправить сообщение
/tariffs — список тарифов
/status DEL-XXXXXX — статус доставки
/bug — случайный таракан
/donate — поддержать проект звёздами ⭐
/author — автор идеи
/whoami — кто я для бота
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

func isSelfKeyword(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "себе", "self", "мне", "сам", "сама":
		return true
	}
	return false
}

func displayName(u *tg.User) string {
	if u == nil {
		return "аноним"
	}
	if u.FirstName != "" {
		return u.FirstName
	}
	if u.UserName != "" {
		return "@" + u.UserName
	}
	return "аноним"
}

// registerUser — регистрирует/обновляет пользователя в backend.
func registerUser(u *tg.User, chatID int64) {
	if u == nil {
		return
	}
	body := map[string]any{
		"chat_id": chatID,
	}
	if u.UserName != "" {
		body["username"] = u.UserName
	}
	if u.FirstName != "" {
		body["first_name"] = u.FirstName
	}
	if u.LastName != "" {
		body["last_name"] = u.LastName
	}
	if err := apiPost("/telegram/users", body, nil); err != nil {
		log.Printf("[bot] register user: %v", err)
	}
}

func lookupUser(username string) (*TelegramUser, error) {
	var u TelegramUser
	if err := apiGet("/telegram/users/by-username/"+username, &u); err != nil {
		return nil, err
	}
	return &u, nil
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
	if out == nil {
		return nil
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
