package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
}

func New(url string) (*Client, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}
	rdb := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, err
	}
	return &Client{rdb: rdb}, nil
}

func (c *Client) SetStatus(ctx context.Context, deliveryID, status string, ttl time.Duration) error {
	if c == nil {
		return nil
	}
	return c.rdb.Set(ctx, "delivery:status:"+deliveryID, status, ttl).Err()
}

func (c *Client) GetStatus(ctx context.Context, deliveryID string) (string, error) {
	if c == nil {
		return "", redis.Nil
	}
	return c.rdb.Get(ctx, "delivery:status:"+deliveryID).Result()
}
