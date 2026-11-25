#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT_DIR"
./scripts/dev-up-app.sh >/dev/null
./scripts/dev-test-app.sh

BACKEND_URL="http://localhost:18080"

LOGIN_RESPONSE="$(curl -fsS -X POST "$BACKEND_URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"username":"analyst","password":"sentinel"}')"
TOKEN="$(printf '%s' "$LOGIN_RESPONSE" | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"

curl -fsS "$BACKEND_URL/api/v1/transactions?page=0&size=8&sortBy=processedAt&sortDir=desc" >/dev/null
curl -fsS "$BACKEND_URL/api/v1/fraud-alerts?page=0&size=8&sortBy=createdAt&sortDir=desc" >/dev/null

ALERT_ID="$(curl -fsS "$BACKEND_URL/api/v1/fraud-alerts?page=0&size=1" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["content"][0]["alertId"])')"

curl -fsS -X PUT "$BACKEND_URL/api/v1/investigations/$ALERT_ID" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"assignedTo":"analyst","status":"IN_REVIEW","summary":"E2E investigation"}' >/dev/null

curl -fsS -X POST "$BACKEND_URL/api/v1/investigations/$ALERT_ID/comments" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"comment":"E2E validation comment"}' >/dev/null

INVESTIGATION="$(curl -fsS "$BACKEND_URL/api/v1/investigations/$ALERT_ID")"
COMMENTS="$(curl -fsS "$BACKEND_URL/api/v1/investigations/$ALERT_ID/comments")"

echo "[OK] Full E2E investigation: $ALERT_ID"
echo "$INVESTIGATION"
echo "$COMMENTS"
