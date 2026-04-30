package service

import (
	"context"
	"log"
	"math/rand"
	"time"

	"github.com/yandexbug/backend/internal/models"
	"github.com/yandexbug/backend/internal/repository"
)

type Simulator struct {
	deliveries *repository.DeliveryRepo
	bugs       *repository.BugRepo
	tickEvery  time.Duration
}

func NewSimulator(d *repository.DeliveryRepo, b *repository.BugRepo) *Simulator {
	return &Simulator{deliveries: d, bugs: b, tickEvery: 3 * time.Second}
}

func (s *Simulator) Run(ctx context.Context) {
	t := time.NewTicker(s.tickEvery)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			s.tick(ctx)
		}
	}
}

func (s *Simulator) tick(ctx context.Context) {
	active, err := s.deliveries.ListActive(ctx)
	if err != nil {
		log.Printf("[simulator] list active: %v", err)
		return
	}
	for _, d := range active {
		jitter := 3 + rand.Intn(4)
		if time.Since(d.UpdatedAt) < time.Duration(jitter)*time.Second {
			continue
		}
		var successRate float32 = 0.6
		switch d.TariffCode {
		case "bug_free":
			successRate = 0.45
		case "bug_plus":
			successRate = 0.65
		case "bug_pro":
			successRate = 0.80
		case "bug_business":
			successRate = 0.85
		case "bug_ultra":
			successRate = 0.95
		}
		next, comment := nextStatus(d.Status, successRate)
		finished := models.IsFinal(next)
		if err := s.deliveries.UpdateStatus(ctx, d.ID, next, finished); err != nil {
			log.Printf("[simulator] update %s: %v", d.ID, err)
			continue
		}
		_ = s.deliveries.AppendEvent(ctx, d.ID, next, comment)
		if finished && d.BugID != nil {
			_ = s.bugs.Release(ctx, *d.BugID)
		}
	}
}

// nextStatus — машина состояний.
func nextStatus(current string, successRate float32) (string, string) {
	r := rand.Float32()

	switch current {
	case models.StatusCreated:
		return models.StatusPacked, "Письмо закреплено"
	case models.StatusPacked:
		return models.StatusBugAssigned, "Назначен таракан-курьер"
	case models.StatusBugAssigned:
		return models.StatusTakeoff, "Таракан вылетел"
	case models.StatusTakeoff:
		return models.StatusInRoute, "В пути"
	case models.StatusInRoute:
		switch {
		case r < 0.15:
			return models.StatusKitchenDelay, "Задержка на кухне — нашёл крошку"
		case r < 0.30:
			return models.StatusCatDetected, "Замечен кот на маршруте"
		case r < 0.45:
			return models.StatusSlipperDanger, "Угроза тапком, маневрируем"
		case r < 0.55:
			return models.StatusWindowBlocked, "Закрыта форточка, ищем окно"
		case r < 0.65:
			return models.StatusLostSignal, "Ушёл за холодильник, потеря связи"
		default:
			return finalize(successRate)
		}
	case models.StatusKitchenDelay,
		models.StatusCatDetected,
		models.StatusSlipperDanger,
		models.StatusWindowBlocked,
		models.StatusLostSignal:
		if r < 0.5 {
			return models.StatusInRoute, "Инцидент пройден, продолжаем путь"
		}
		return finalize(successRate)
	}
	return current, ""
}

func finalize(successRate float32) (string, string) {
	r := rand.Float32()
	if r < successRate {
		return models.StatusDelivered, "Сообщение доставлено получателю"
	}
	x := rand.Float32()
	switch {
	case x < 0.4:
		return models.StatusFailed, "Миссия провалена"
	case x < 0.75:
		return models.StatusEaten, "Курьер съеден котом"
	default:
		return models.StatusHero, "Курьер погиб геройски, выполнив часть миссии"
	}
}
