#!/usr/bin/env zsh
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/sentinel.dump"
  exit 1
fi

INPUT="$1"
if [[ ! -f "$INPUT" ]]; then
  echo "Backup file not found: $INPUT"
  exit 1
fi

docker cp "$INPUT" sentinel-postgres-1:/tmp/sentinel-restore.dump
docker exec sentinel-postgres-1 pg_restore \
  -U sentinel \
  -d sentinel \
  --clean --if-exists \
  /tmp/sentinel-restore.dump
docker exec sentinel-postgres-1 rm -f /tmp/sentinel-restore.dump

echo "[OK] PostgreSQL restore completed"
