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

	deliverySvc := service.NewDeliveryService(deliveryRepo, bugRepo, tariffRepo, redisClient)
	simulator := service.NewSimulator(deliveryRepo, bugRepo)

	go simulator.Run(ctx)
	log.Println("[simulator] started")

	router := api.NewRouter(deliverySvc, tariffRepo, bugRepo)

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
