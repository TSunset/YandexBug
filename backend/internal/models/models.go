package models

import "time"

const (
	StatusCreated       = "CREATED"
	StatusPacked        = "PACKED"
	StatusBugAssigned   = "BUG_ASSIGNED"
	StatusTakeoff       = "TAKEOFF"
	StatusInRoute       = "IN_ROUTE"
	StatusKitchenDelay  = "KITCHEN_DELAY"
	StatusCatDetected   = "CAT_DETECTED"
	StatusSlipperDanger = "SLIPPER_DANGER"
	StatusWindowBlocked = "WINDOW_BLOCKED"
	StatusLostSignal    = "LOST_SIGNAL"
	StatusDelivered     = "DELIVERED"
	StatusFailed        = "FAILED"
	StatusEaten         = "EATEN"
	StatusHero          = "HERO_STATUS"
)

func IsFinal(status string) bool {
	switch status {
	case StatusDelivered, StatusFailed, StatusEaten, StatusHero:
		return true
	}
	return false
}

type Tariff struct {
	ID          int      `json:"-"`
	Code        string   `json:"code"`
	Name        string   `json:"name"`
	Price       int      `json:"price"`
	Description string   `json:"description"`
	Features    []string `json:"features"`
	SuccessRate float32  `json:"success_rate"`
	IsPopular   bool     `json:"is_popular"`
	SortOrder   int      `json:"-"`
}

type Bug struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Class  string `json:"class"`
	IsBusy bool   `json:"is_busy"`
}

type Delivery struct {
	ID               string     `json:"id"`
	SenderName       *string    `json:"sender_name,omitempty"`
	RecipientAddress string     `json:"recipient_address"`
	Message          string     `json:"message"`
	TariffCode       string     `json:"tariff"`
	BugID            *int       `json:"-"`
	BugName          *string    `json:"bug_name,omitempty"`
	BugClass         *string    `json:"bug_class,omitempty"`
	Priority         string     `json:"priority"`
	NotifyChannel    string     `json:"notify_channel"`
	TelegramChatID   *int64     `json:"-"`
	RecipientUserID  *string    `json:"-"`
	Status           string     `json:"status"`
	ETAMinutes       int        `json:"eta_minutes"`
	Threats          []string   `json:"threats"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	FinishedAt       *time.Time `json:"finished_at,omitempty"`
}

type DeliveryEvent struct {
	ID         int       `json:"id"`
	DeliveryID string    `json:"delivery_id"`
	Status     string    `json:"status"`
	Comment    *string   `json:"comment,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

type TelegramUser struct {
	ChatID    int64     `json:"chat_id"`
	Username  *string   `json:"username,omitempty"`
	FirstName *string   `json:"first_name,omitempty"`
	LastName  *string   `json:"last_name,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type User struct {
	ID               string    `json:"id"`
	Username         string    `json:"username"`
	Email            *string   `json:"email,omitempty"`
	PasswordHash     *string   `json:"-"`
	DisplayName      string    `json:"display_name"`
	TelegramChatID   *int64    `json:"telegram_chat_id,omitempty"`
	TelegramUsername *string   `json:"telegram_username,omitempty"`
	AvatarURL        *string   `json:"avatar_url,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type InboxMessage struct {
	ID              string    `json:"id"`
	RecipientUserID string    `json:"recipient_user_id"`
	DeliveryID      *string   `json:"delivery_id,omitempty"`
	SenderDisplay   string    `json:"sender_display"`
	Message         string    `json:"message"`
	IsRead          bool      `json:"is_read"`
	CreatedAt       time.Time `json:"created_at"`
}

type PendingTelegram struct {
	ID         string     `json:"id"`
	ChatID     int64      `json:"chat_id"`
	Text       string     `json:"text"`
	ParseMode  string     `json:"parse_mode"`
	DeliveryID *string    `json:"delivery_id,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	ClaimedAt  *time.Time `json:"claimed_at,omitempty"`
	SentAt     *time.Time `json:"sent_at,omitempty"`
}

type Donation struct {
	ID               string     `json:"id"`
	UserID           *string    `json:"user_id,omitempty"`
	TelegramChatID   *int64     `json:"telegram_chat_id,omitempty"`
	Stars            int        `json:"stars"`
	Payload          string     `json:"payload"`
	ProviderChargeID *string    `json:"provider_charge_id,omitempty"`
	Status           string     `json:"status"`
	InvoiceURL       *string    `json:"invoice_url,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	PaidAt           *time.Time `json:"paid_at,omitempty"`
}
