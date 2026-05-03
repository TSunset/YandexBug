package config

import "os"

type Config struct {
	DatabaseURL      string
	RedisURL         string
	Port             string
	JWTSecret        string
	TelegramBotToken string
}

func Load() *Config {
	return &Config{
		DatabaseURL:      getenv("DATABASE_URL", "postgres://yandexbug:yandexbug_secret@postgres:5432/yandexbug?sslmode=disable"),
		RedisURL:         getenv("REDIS_URL", "redis://redis:6379/0"),
		Port:             getenv("BACKEND_PORT", "8080"),
		JWTSecret:        getenv("JWT_SECRET", "yandexbug-dev-secret-change-me"),
		TelegramBotToken: getenv("TELEGRAM_BOT_TOKEN", ""),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
