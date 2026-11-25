#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

docker run --rm \
  --network sentinel_default \
  -e SENTINEL_BASE_URL=http://sentinel-backend-1:8080 \
  -v "$ROOT_DIR/load-tests:/scripts:ro" \
  grafana/k6:0.55.0 run /scripts/backend-smoke.js
