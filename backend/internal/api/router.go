package api

import (
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/yandexbug/backend/internal/auth"
	"github.com/yandexbug/backend/internal/repository"
	"github.com/yandexbug/backend/internal/service"
)

type RouterDeps struct {
	DeliverySvc   *service.DeliveryService
	Tariffs       *repository.TariffRepo
	Bugs          *repository.BugRepo
	TelegramUsers *repository.TelegramUserRepo
	Users         *repository.UserRepo
	Inbox         *repository.InboxRepo
	Pending       *repository.PendingTelegramRepo
	Donations     *repository.DonationRepo
	TG            *service.TelegramAPI

	JWTSecret []byte
	BotToken  string
}

func NewRouter(d RouterDeps) chi.Router {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		// Для cookie-аутентификации нельзя AllowedOrigins:["*"], нужно указать домен
		// и разрешить credentials. В демо: разрешаем localhost.
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS", "DELETE"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}))

	r.Use(auth.Middleware(d.JWTSecret))

	h := &Handlers{
		Deliveries:    d.DeliverySvc,
		Tariffs:       d.Tariffs,
		Bugs:          d.Bugs,
		TelegramUsers: d.TelegramUsers,
		Users:         d.Users,
	}
	authH := &AuthHandlers{D: AuthDeps{
		Users:    d.Users,
		Secret:   d.JWTSecret,
		BotToken: d.BotToken,
	}}
	inboxH := &InboxHandlers{Inbox: d.Inbox}
	usersH := &UsersHandlers{Users: d.Users, TelegramUsers: d.TelegramUsers}
	internalH := &InternalHandlers{Pending: d.Pending}
	donH := &DonationHandlers{Donations: d.Donations, Users: d.Users, TG: d.TG}

	r.Get("/health", h.Health)
	r.Get("/tariffs", h.ListTariffs)
	r.Get("/bugs", h.ListBugs)

	r.Route("/deliveries", func(r chi.Router) {
		r.Get("/", h.ListDeliveries)
		r.Post("/", h.CreateDelivery)
		r.Get("/{id}", h.GetDelivery)
		r.Post("/{id}/simulate", h.SimulateDelivery)
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/register", authH.Register)
		r.Post("/login", authH.Login)
		r.Post("/logout", authH.Logout)
		r.Get("/me", authH.Me)
		r.Get("/telegram", authH.TelegramLogin)  // Login Widget делает GET с query
		r.Post("/telegram", authH.TelegramLogin) // или POST с JSON
		r.With(auth.RequireAuth).Post("/link-telegram", authH.LinkTelegram)
	})

	r.Route("/users", func(r chi.Router) {
		r.Get("/lookup/{handle}", usersH.Lookup)
	})

	r.Route("/inbox", func(r chi.Router) {
		r.Use(auth.RequireAuth)
		r.Get("/", inboxH.List)
		r.Get("/unread-count", inboxH.UnreadCount)
		r.Post("/{id}/read", inboxH.MarkRead)
	})

	r.Route("/telegram/users", func(r chi.Router) {
		r.Post("/", h.RegisterTelegramUser)
		r.Get("/by-username/{username}", h.FindTelegramUser)
	})

	r.Route("/internal/telegram", func(r chi.Router) {
		r.Get("/pending", internalH.ClaimPending)
		r.Post("/pending/{id}/sent", internalH.MarkSent)
		r.Post("/pending/{id}/release", internalH.ReleasePending)
	})

	r.Route("/donations", func(r chi.Router) {
		r.Post("/create-invoice", donH.CreateInvoice)
		r.With(auth.RequireAuth).Get("/me", donH.MyDonations)
		r.Get("/by-payload/{payload}", donH.GetByPayload)
	})

	r.Route("/internal/donations", func(r chi.Router) {
		r.Post("/{payload}/paid", donH.MarkPaid)
	})

	return r
}
