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

ensure_env_key() {
  local key="$1"
  local default_value="$2"
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    echo "${key}=${default_value}" >>"$ENV_FILE"
    echo "Added ${key}=${default_value} to $ENV_FILE"
  fi
}

ensure_env_key "BACKEND_PORT" "18080"
ensure_env_key "FRONTEND_PORT" "5173"

# shellcheck disable=SC1090
source "$ENV_FILE"

cd "$COMPOSE_DIR"
docker compose --project-name sentinel --env-file "$ENV_FILE" --profile app up -d --build

echo "Sentinel full platform is running."
echo "Backend API: http://localhost:${BACKEND_PORT}"
echo "Frontend:    http://localhost:${FRONTEND_PORT}"
