# fraud-engine-cpp

C++ real-time fraud detection engine for Sentinel.

## Current Phase Scope

- Consumes transactions from `transactions.raw`
- Applies rule-based scoring (0-100)
- Publishes enriched events to `transactions.scored`
- Publishes high-risk alerts to `alerts.generated`
- Validates required transaction fields before scoring

Event schema reference:

- `docs/api/event-contracts.md`

## Implemented Rules

- `high_amount`: adds points when amount exceeds threshold
- `velocity_check`: adds points when an account exceeds tx count in a time window
- `geographic_anomaly`: adds points when account country changes within a short window

## Runtime Configuration

- `SENTINEL_KAFKA_BROKERS` (default: `localhost:29092`)
- `SENTINEL_INPUT_TOPIC` (default: `transactions.raw`)
- `SENTINEL_SCORED_TOPIC` (default: `transactions.scored`)
- `SENTINEL_ALERTS_TOPIC` (default: `alerts.generated`)
- `SENTINEL_CONSUMER_GROUP` (default: `sentinel-fraud-engine`)
- `SENTINEL_HIGH_AMOUNT_THRESHOLD` (default: `5000`)
- `SENTINEL_HIGH_AMOUNT_POINTS` (default: `30`)
- `SENTINEL_VELOCITY_WINDOW_SECONDS` (default: `60`)
- `SENTINEL_VELOCITY_MAX_TX` (default: `5`)
- `SENTINEL_VELOCITY_POINTS` (default: `25`)
- `SENTINEL_GEO_WINDOW_SECONDS` (default: `120`)
- `SENTINEL_GEO_POINTS` (default: `20`)
- `SENTINEL_HIGH_RISK_THRESHOLD` (default: `70`)

## Docker Build and Run

Build:

```zsh
docker build -t sentinel/fraud-engine-cpp:dev ./fraud-engine-cpp
```

Run:

```zsh
docker run --rm \
	--network sentinel_default \
	-e SENTINEL_KAFKA_BROKERS=kafka:9092 \
	sentinel/fraud-engine-cpp:dev
```

## Validate Output Topics

Scored events:

```zsh
docker exec sentinel-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
	--bootstrap-server localhost:9092 \
	--topic transactions.scored \
	--from-beginning \
	--max-messages 5
```

Alerts:

```zsh
docker exec sentinel-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
	--bootstrap-server localhost:9092 \
	--topic alerts.generated \
	--from-beginning \
	--max-messages 5
```

## End-to-End Script

Run a full local E2E test (simulator -> engine -> scored/alerts topics):

```zsh
./scripts/pipeline-e2e.sh
```
