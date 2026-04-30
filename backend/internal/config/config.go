package config

import "os"

type Config struct {
	DatabaseURL string
	RedisURL    string
	Port        string
}

func Load() *Config {
	return &Config{
		DatabaseURL: getenv("DATABASE_URL", "postgres://yandexbug:yandexbug_secret@postgres:5432/yandexbug?sslmode=disable"),
		RedisURL:    getenv("REDIS_URL", "redis://redis:6379/0"),
		Port:        getenv("BACKEND_PORT", "8080"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
