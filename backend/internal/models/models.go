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
