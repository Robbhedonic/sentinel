#!/usr/bin/env zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

"$ROOT_DIR/scripts/dev-up.sh"
"$ROOT_DIR/scripts/dev-test.sh"

docker build -t sentinel/simulator-c:dev "$ROOT_DIR/simulator-c" >/dev/null
docker build -t sentinel/fraud-engine-cpp:dev "$ROOT_DIR/fraud-engine-cpp" >/dev/null

SUFFIX="$(date +%s)"
RAW_TOPIC="transactions.raw.e2e.$SUFFIX"
SCORED_TOPIC="transactions.scored.e2e.$SUFFIX"
ALERT_TOPIC="alerts.generated.e2e.$SUFFIX"
ENGINE_CONTAINER="sentinel-fraud-engine-e2e-$SUFFIX"

cleanup() {
  docker rm -f "$ENGINE_CONTAINER" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --rm \
  --network sentinel_default \
  --name "$ENGINE_CONTAINER" \
  -e SENTINEL_KAFKA_BROKERS=kafka:9092 \
  -e SENTINEL_INPUT_TOPIC="$RAW_TOPIC" \
  -e SENTINEL_SCORED_TOPIC="$SCORED_TOPIC" \
  -e SENTINEL_ALERTS_TOPIC="$ALERT_TOPIC" \
  -e SENTINEL_HIGH_RISK_THRESHOLD=30 \
  sentinel/fraud-engine-cpp:dev >/dev/null

docker run --rm \
  --network sentinel_default \
  sentinel/simulator-c:dev \
  ./build/simulator \
  --brokers kafka:9092 \
  --topic "$RAW_TOPIC" \
  --events 30 \
  --tps 20 \
  --suspicious-ratio 60 >/dev/null

SCORED_SAMPLE="$(docker exec sentinel-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic "$SCORED_TOPIC" \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 10000 2>/dev/null || true)"

ALERT_SAMPLE="$(docker exec sentinel-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic "$ALERT_TOPIC" \
  --from-beginning \
  --max-messages 1 \
  --timeout-ms 10000 2>/dev/null || true)"

if [[ -z "$SCORED_SAMPLE" ]]; then
  echo "[FAIL] No scored messages found on $SCORED_TOPIC"
  exit 1
fi

if [[ -z "$ALERT_SAMPLE" ]]; then
  echo "[FAIL] No alert messages found on $ALERT_TOPIC"
  exit 1
fi

echo "[OK] Scored sample:"
echo "$SCORED_SAMPLE"
echo "[OK] Alert sample:"
echo "$ALERT_SAMPLE"
echo "Pipeline E2E passed."
