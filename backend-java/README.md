# backend-java

Spring Boot backend for Sentinel pipeline ingestion.

## Current Scope

- Consumes Kafka topics `transactions.scored` and `alerts.generated`
- Persists scored transactions and alerts in PostgreSQL
- Exposes initial read endpoints for frontend integration

## Configuration

Environment variables:

- `SENTINEL_DB_HOST` (default: `localhost`)
- `SENTINEL_DB_PORT` (default: `5432`)
- `SENTINEL_DB_NAME` (default: `sentinel`)
- `SENTINEL_DB_USER` (default: `sentinel`)
- `SENTINEL_DB_PASSWORD` (default: `sentinel`)
- `SENTINEL_KAFKA_BOOTSTRAP_SERVERS` (default: `localhost:29092`)
- `SENTINEL_KAFKA_CONSUMER_GROUP` (default: `sentinel-backend`)
- `SENTINEL_SCORED_TOPIC` (default: `transactions.scored`)
- `SENTINEL_ALERTS_TOPIC` (default: `alerts.generated`)

## Run

```zsh
cd backend-java
mvn spring-boot:run
```

## API Endpoints

- `GET /api/v1/transactions?page=0&size=50&accountId=ACC-1234&riskLevel=LOW&minRiskScore=20&maxRiskScore=80&minAmount=100&maxAmount=10000&sortBy=processedAt&sortDir=desc`
- `GET /api/v1/fraud-alerts?page=0&size=50&accountId=ACC-1234&status=OPEN&riskLevel=HIGH&minRiskScore=40&maxRiskScore=100&sortBy=createdAt&sortDir=desc`
- `GET /api/v1/analytics/overview`
- `GET /api/v1/health/pipeline`
