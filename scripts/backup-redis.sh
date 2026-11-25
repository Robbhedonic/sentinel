#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups/redis"
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT="$BACKUP_DIR/dump-$TIMESTAMP.rdb"

docker exec sentinel-redis-1 redis-cli SAVE >/dev/null
docker cp sentinel-redis-1:/data/dump.rdb "$OUTPUT"

echo "[OK] Redis snapshot: $OUTPUT"
