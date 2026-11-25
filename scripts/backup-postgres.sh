#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups/postgres"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT="$BACKUP_DIR/sentinel-$TIMESTAMP.dump"

docker exec sentinel-postgres-1 pg_dump \
  -U sentinel \
  -d sentinel \
  -Fc \
  -f "/tmp/sentinel-backup.dump"

docker cp sentinel-postgres-1:/tmp/sentinel-backup.dump "$OUTPUT"
docker exec sentinel-postgres-1 rm -f /tmp/sentinel-backup.dump

echo "[OK] PostgreSQL backup: $OUTPUT"
