package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/yandexbug/backend/internal/repository"
	"github.com/yandexbug/backend/internal/service"
)

func NewRouter(deliverySvc *service.DeliveryService, tariffRepo *repository.TariffRepo, bugRepo *repository.BugRepo) chi.Router {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	}))

	h := &Handlers{
		Deliveries: deliverySvc,
		Tariffs:    tariffRepo,
		Bugs:       bugRepo,
	}

	r.Get("/health", h.Health)
	r.Get("/tariffs", h.ListTariffs)
	r.Get("/bugs", h.ListBugs)

	r.Route("/deliveries", func(r chi.Router) {
		r.Get("/", h.ListDeliveries)
		r.Post("/", h.CreateDelivery)
		r.Get("/{id}", h.GetDelivery)
		r.Post("/{id}/simulate", h.SimulateDelivery)
	})

	return r
}
