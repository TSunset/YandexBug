package service

import (
	"context"
	"fmt"
	"log"

	"github.com/yandexbug/backend/internal/auth"
	"github.com/yandexbug/backend/internal/models"
	"github.com/yandexbug/backend/internal/repository"
)

// DeliveryNotifier — реализация FinalNotifier:
// - кладёт сообщение в inbox получателя-сайтовика (если он есть)
// - кладёт сообщение в очередь Telegram (если у получателя есть TG)
type DeliveryNotifier struct {
	Inbox   *repository.InboxRepo
	Pending *repository.PendingTelegramRepo
	Users   *repository.UserRepo
}

func NewDeliveryNotifier(inbox *repository.InboxRepo, pending *repository.PendingTelegramRepo, users *repository.UserRepo) *DeliveryNotifier {
	return &DeliveryNotifier{Inbox: inbox, Pending: pending, Users: users}
}

func (n *DeliveryNotifier) OnFinal(ctx context.Context, d *models.Delivery) {
	if d == nil {
		return
	}
	delivered := d.Status == models.StatusDelivered

	senderName := "Аноним"
	if d.SenderName != nil && *d.SenderName != "" {
		senderName = *d.SenderName
	}

	// Inbox для пользователя сайта (только при успехе).
	if delivered && d.RecipientUserID != nil {
		msg := &models.InboxMessage{
			ID:              auth.NewID("ib_"),
			RecipientUserID: *d.RecipientUserID,
			DeliveryID:      &d.ID,
			SenderDisplay:   senderName,
			Message:         d.Message,
		}
		if err := n.Inbox.Create(ctx, msg); err != nil {
			log.Printf("[notifier] inbox create: %v", err)
		}
	}

	// Telegram для получателя — берём chat_id из delivery либо из связанного user.
	chatID := int64(0)
	if d.TelegramChatID != nil {
		chatID = *d.TelegramChatID
	}
	if chatID == 0 && d.RecipientUserID != nil {
		if u, err := n.Users.GetByID(ctx, *d.RecipientUserID); err == nil && u.TelegramChatID != nil {
			chatID = *u.TelegramChatID
		}
	}

	if chatID == 0 {
		return
	}

	var text string
	if delivered {
		text = fmt.Sprintf(
			"<b>📬 Вам прилетел таракан с сообщением!</b>\n"+
				"От: %s\n"+
				"ID доставки: %s\n\n"+
				"<b>💌 Сообщение:</b>\n%s\n\n"+
				"<i>Таракан жив, даже если интернет мертв.</i>",
			htmlEscape(senderName), d.ID, htmlEscape(d.Message),
		)
	} else {
		text = fmt.Sprintf(
			"<b>💀 Курьер не долетел до вас.</b>\nID: %s\nСтатус: %s",
			d.ID, d.Status,
		)
	}

	pt := &models.PendingTelegram{
		ID:         auth.NewID("pt_"),
		ChatID:     chatID,
		Text:       text,
		ParseMode:  "HTML",
		DeliveryID: &d.ID,
	}
	if err := n.Pending.Enqueue(ctx, pt); err != nil {
		log.Printf("[notifier] enqueue pt: %v", err)
	}
}

func htmlEscape(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch r {
		case '<':
			out = append(out, []rune("&lt;")...)
		case '>':
			out = append(out, []rune("&gt;")...)
		case '&':
			out = append(out, []rune("&amp;")...)
		default:
			out = append(out, r)
		}
	}
	return string(out)
}
