# Event Contracts

This document defines the current Kafka event contracts used by Sentinel.

## Versioning

- All events include `event_version`.
- Current version: `1`.
- Additive, backward-compatible changes should keep the same major version.

## Topic: transactions.raw

Producer: `simulator-c`

```json
{
  "event_version": 1,
  "event_type": "transaction_created",
  "source": "simulator-c",
  "transaction_id": "TX-000001",
  "account_id": "ACC-1234",
  "recipient_id": "REC-7890",
  "amount": 5230.50,
  "currency": "EUR",
  "transaction_type": "TRANSFER",
  "country": "SE",
  "timestamp": "2026-11-08T12:30:00Z",
  "simulated_pattern": "SUSPICIOUS"
}
```

Required fields:

- `event_version` >= 1
- non-empty `transaction_id`, `account_id`, `recipient_id`
- positive finite `amount`
- uppercase `currency` (3 chars), example `EUR`
- uppercase `country` (2 chars), example `SE`
- `timestamp` format `YYYY-MM-DDTHH:MM:SSZ`

## Topic: transactions.scored

Producer: `fraud-engine-cpp`

```json
{
  "event_version": 1,
  "event_type": "transaction_scored",
  "source": "fraud-engine-cpp",
  "transaction_id": "TX-000001",
  "account_id": "ACC-1234",
  "recipient_id": "REC-7890",
  "amount": 5230.5,
  "currency": "EUR",
  "transaction_type": "TRANSFER",
  "country": "SE",
  "timestamp": "2026-11-08T12:30:00Z",
  "simulated_pattern": "SUSPICIOUS",
  "risk_score": 55,
  "risk_level": "MEDIUM",
  "findings": [
    {
      "rule": "high_amount",
      "points": 30,
      "reason": "amount 5230.5 >= threshold 5000"
    }
  ],
  "processed_at": "2026-11-08T12:30:01Z"
}
```

## Topic: alerts.generated

Producer: `fraud-engine-cpp`

```json
{
  "event_version": 1,
  "event_type": "fraud_alert_generated",
  "source": "fraud-engine-cpp",
  "alert_id": "AL-TX-000001",
  "transaction_id": "TX-000001",
  "account_id": "ACC-1234",
  "risk_score": 75,
  "risk_level": "HIGH",
  "status": "OPEN",
  "findings": [
    {
      "rule": "high_amount",
      "points": 30,
      "reason": "amount 15230 >= threshold 5000"
    }
  ],
  "created_at": "2026-11-08T12:30:01Z"
}
```
