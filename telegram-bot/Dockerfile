FROM golang:1.22-alpine AS builder

ENV GOPROXY=https://goproxy.cn,https://goproxy.io,direct

WORKDIR /src
COPY go.mod ./
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/bot .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /out/bot /app/bot
COPY --from=builder /src/static /app/static
CMD ["/app/bot"]
