package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/yandexbug/backend/internal/cache"
	"github.com/yandexbug/backend/internal/models"
	"github.com/yandexbug/backend/internal/repository"
)

var ErrInvalidInput = errors.New("invalid input")

type DeliveryService struct {
	deliveries *repository.DeliveryRepo
	bugs       *repository.BugRepo
	tariffs    *repository.TariffRepo
	cache      *cache.Client
}

func NewDeliveryService(d *repository.DeliveryRepo, b *repository.BugRepo, t *repository.TariffRepo, c *cache.Client) *DeliveryService {
	return &DeliveryService{deliveries: d, bugs: b, tariffs: t, cache: c}
}

type CreateDeliveryInput struct {
	SenderName       string
	RecipientAddress string
	Message          string
	TariffCode       string
	Priority         string
	NotifyChannel    string
	TelegramChatID   *int64
}

var (
	threatsPool = []string{"кот", "тапок", "пылесос", "форточка", "сквозняк", "холодильник", "сосед", "лампа", "ребёнок с мухобойкой", "робот-пылесос"}

	classByTariff = map[string]string{
		"bug_free":     "Courier Basic",
		"bug_plus":     "Courier Basic",
		"bug_pro":      "Flyer",
		"bug_business": "Veteran Bug",
		"bug_ultra":    "Flyer",
	}

	etaByTariff = map[string][2]int{
		"bug_free":     {15, 40},
		"bug_plus":     {10, 20},
		"bug_pro":      {6, 12},
		"bug_business": {7, 15},
		"bug_ultra":    {3, 6},
	}
)

func (s *DeliveryService) Create(ctx context.Context, in CreateDeliveryInput) (*models.Delivery, error) {
	in.Message = strings.TrimSpace(in.Message)
	in.RecipientAddress = strings.TrimSpace(in.RecipientAddress)
	in.TariffCode = strings.TrimSpace(in.TariffCode)
	in.SenderName = strings.TrimSpace(in.SenderName)

	if in.Message == "" {
		return nil, fmt.Errorf("%w: пустое сообщение", ErrInvalidInput)
	}
	if len([]rune(in.Message)) > 256 {
		return nil, fmt.Errorf("%w: сообщение длиннее 256 символов", ErrInvalidInput)
	}
	if in.RecipientAddress == "" {
		return nil, fmt.Errorf("%w: пустой адрес получателя", ErrInvalidInput)
	}
	if in.TariffCode == "" {
		in.TariffCode = "bug_free"
	}
	if _, err := s.tariffs.GetByCode(ctx, in.TariffCode); err != nil {
		return nil, fmt.Errorf("%w: неизвестный тариф %q", ErrInvalidInput, in.TariffCode)
	}
	if in.Priority == "" {
		in.Priority = "normal"
	}
	if in.NotifyChannel == "" {
		in.NotifyChannel = "site"
	}

	preferredClass := classByTariff[in.TariffCode]
	bug, err := s.bugs.PickAvailable(ctx, preferredClass)
	if err != nil {
		return nil, fmt.Errorf("назначить таракана: %w", err)
	}

	etaRange := etaByTariff[in.TariffCode]
	if etaRange == [2]int{} {
		etaRange = [2]int{10, 20}
	}
	eta := etaRange[0] + rand.Intn(etaRange[1]-etaRange[0]+1)

	threats := pickThreats(2 + rand.Intn(2))
	now := time.Now().UTC()

	d := &models.Delivery{
		ID:               generateID(),
		RecipientAddress: in.RecipientAddress,
		Message:          in.Message,
		TariffCode:       in.TariffCode,
		BugID:            &bug.ID,
		BugName:          &bug.Name,
		BugClass:         &bug.Class,
		Priority:         in.Priority,
		NotifyChannel:    in.NotifyChannel,
		TelegramChatID:   in.TelegramChatID,
		Status:           models.StatusBugAssigned,
		ETAMinutes:       eta,
		Threats:          threats,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	if in.SenderName != "" {
		d.SenderName = &in.SenderName
	}

	if err := s.deliveries.Create(ctx, d); err != nil {
		_ = s.bugs.Release(ctx, bug.ID)
		return nil, fmt.Errorf("сохранить заказ: %w", err)
	}

	_ = s.deliveries.AppendEvent(ctx, d.ID, models.StatusCreated, "Сообщение принято")
	_ = s.deliveries.AppendEvent(ctx, d.ID, models.StatusPacked, "Письмо закреплено на курьере")
	_ = s.deliveries.AppendEvent(ctx, d.ID, models.StatusBugAssigned, fmt.Sprintf("Назначен %s (%s)", bug.Name, bug.Class))

	if s.cache != nil {
		_ = s.cache.SetStatus(ctx, d.ID, d.Status, 24*time.Hour)
	}
	return d, nil
}

func (s *DeliveryService) Get(ctx context.Context, id string) (*models.Delivery, error) {
	return s.deliveries.Get(ctx, id)
}

func (s *DeliveryService) ListRecent(ctx context.Context, limit int) ([]models.Delivery, error) {
	return s.deliveries.ListRecent(ctx, limit)
}

func (s *DeliveryService) SimulateForce(ctx context.Context, id string) (*models.Delivery, error) {
	d, err := s.deliveries.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	if models.IsFinal(d.Status) {
		return d, nil
	}
	tariff, _ := s.tariffs.GetByCode(ctx, d.TariffCode)
	successRate := float32(0.5)
	if tariff != nil {
		successRate = tariff.SuccessRate
	}
	next, comment := nextStatus(d.Status, successRate)
	finished := models.IsFinal(next)
	if err := s.deliveries.UpdateStatus(ctx, id, next, finished); err != nil {
		return nil, err
	}
	_ = s.deliveries.AppendEvent(ctx, id, next, comment)
	if finished && d.BugID != nil {
		_ = s.bugs.Release(ctx, *d.BugID)
	}
	if s.cache != nil {
		_ = s.cache.SetStatus(ctx, id, next, 24*time.Hour)
	}
	return s.deliveries.Get(ctx, id)
}

func generateID() string {
	return fmt.Sprintf("DEL-%06d", 100000+rand.Intn(900000))
}

func pickThreats(n int) []string {
	if n <= 0 {
		return []string{}
	}
	picked := make(map[string]struct{}, n)
	for len(picked) < n && len(picked) < len(threatsPool) {
		picked[threatsPool[rand.Intn(len(threatsPool))]] = struct{}{}
	}
	out := make([]string, 0, len(picked))
	for k := range picked {
		out = append(out, k)
	}
	return out
}
