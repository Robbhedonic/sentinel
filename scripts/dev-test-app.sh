#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"
ENV_FILE="$COMPOSE_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  if ! grep -q "^BACKEND_PORT=" "$ENV_FILE"; then
    echo "BACKEND_PORT=18080" >>"$ENV_FILE"
  fi
  if ! grep -q "^FRONTEND_PORT=" "$ENV_FILE"; then
    echo "FRONTEND_PORT=5173" >>"$ENV_FILE"
  fi
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

BACKEND_PORT="${BACKEND_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

check_url() {
  local name="$1"
  local url="$2"
  local attempts="${3:-25}"
  local wait_seconds="${4:-2}"
  local i=1

  while (( i <= attempts )); do
    if curl -fsS "$url" >/dev/null; then
      echo "[OK] $name -> $url"
      return 0
    fi
    sleep "$wait_seconds"
    ((i++))
  done

  echo "[FAIL] $name -> $url"
  return 1
}

check_url "Backend health" "http://localhost:${BACKEND_PORT}/actuator/health"
check_url "Backend analytics" "http://localhost:${BACKEND_PORT}/api/v1/analytics/overview"
check_url "Frontend" "http://localhost:${FRONTEND_PORT}"

echo "All app platform checks passed."
