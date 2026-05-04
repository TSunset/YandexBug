package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/yandexbug/backend/internal/api"
	"github.com/yandexbug/backend/internal/cache"
	"github.com/yandexbug/backend/internal/config"
	"github.com/yandexbug/backend/internal/db"
	"github.com/yandexbug/backend/internal/repository"
	"github.com/yandexbug/backend/internal/service"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}
	defer pool.Close()

	if err := db.Migrate(ctx, pool, "/app/migrations"); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("[db] migrations applied")

	redisClient, err := cache.New(cfg.RedisURL)
	if err != nil {
		log.Printf("[cache] redis недоступен, продолжаем без кэша: %v", err)
		redisClient = nil
	} else {
		log.Println("[cache] redis ok")
	}

	tariffRepo := repository.NewTariffRepo(pool)
	bugRepo := repository.NewBugRepo(pool)
	deliveryRepo := repository.NewDeliveryRepo(pool)
	tgUserRepo := repository.NewTelegramUserRepo(pool)
	userRepo := repository.NewUserRepo(pool)
	inboxRepo := repository.NewInboxRepo(pool)
	pendingRepo := repository.NewPendingTelegramRepo(pool)
	donationRepo := repository.NewDonationRepo(pool)

	tgAPI := service.NewTelegramAPI(cfg.TelegramBotToken)

	deliverySvc := service.NewDeliveryService(deliveryRepo, bugRepo, tariffRepo, redisClient)
	notifier := service.NewDeliveryNotifier(inboxRepo, pendingRepo, userRepo)
	simulator := service.NewSimulator(deliveryRepo, bugRepo, notifier)

	go simulator.Run(ctx)
	log.Println("[simulator] started")

	go func() {
		ticker := time.NewTicker(30 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				n, err := deliveryRepo.DeleteOlderThan(ctx, 6*time.Hour)
				if err != nil {
					log.Printf("[cleanup] error: %v", err)
				} else if n > 0 {
					log.Printf("[cleanup] deleted %d deliveries older than 6h", n)
				}
				if err := deliveryRepo.KeepLatest(ctx, 12); err != nil {
					log.Printf("[cleanup] keep-latest error: %v", err)
				}
			}
		}
	}()
	log.Println("[cleanup] started")

	router := api.NewRouter(api.RouterDeps{
		DeliverySvc:   deliverySvc,
		Tariffs:       tariffRepo,
		Bugs:          bugRepo,
		TelegramUsers: tgUserRepo,
		Users:         userRepo,
		Inbox:         inboxRepo,
		Pending:       pendingRepo,
		Donations:     donationRepo,
		TG:            tgAPI,
		JWTSecret:     []byte(cfg.JWTSecret),
		BotToken:      cfg.TelegramBotToken,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("[http] listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	log.Println("[http] shutting down...")
	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	_ = srv.Shutdown(shutdownCtx)
}
