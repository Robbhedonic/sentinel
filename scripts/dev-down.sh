#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"

cd "$COMPOSE_DIR"
docker compose --project-name sentinel down

echo "Sentinel base platform is stopped."
