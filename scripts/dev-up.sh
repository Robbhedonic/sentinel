#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"
ENV_EXAMPLE="$COMPOSE_DIR/.env.example"
ENV_FILE="$COMPOSE_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ENV_EXAMPLE" "$ENV_FILE"
  echo "Created $ENV_FILE from .env.example"
fi

cd "$COMPOSE_DIR"
docker compose --project-name sentinel up -d

echo "Sentinel base platform is running."
echo "Kafka:      localhost:29092"
echo "PostgreSQL: localhost:5432"
echo "Redis:      localhost:6379"
echo "Prometheus: http://localhost:9090"
echo "Grafana:    http://localhost:3000"
