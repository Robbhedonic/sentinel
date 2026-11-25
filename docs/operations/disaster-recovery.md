# Sentinel Disaster Recovery

## Scope

This runbook covers local PostgreSQL and Redis recovery for Sentinel development environments.

## Recovery objectives

- **RPO:** maximum 24 hours for scheduled backups; test for 4-hour RPO by running backups more frequently.
- **RTO:** target 30 minutes for a local stack restore.

## PostgreSQL backup

```zsh
./scripts/backup-postgres.sh
```

Backups are written to `backups/postgres/sentinel-*.dump`.

## PostgreSQL restore

Stop application containers first:

```zsh
docker compose --project-name sentinel -f infrastructure/docker/docker-compose.yml stop backend frontend
./scripts/restore-postgres.sh /absolute/path/to/sentinel.dump
./scripts/dev-up-app.sh
```

## Redis snapshot

```zsh
./scripts/backup-redis.sh
```

Redis snapshots are written to `backups/redis/dump-*.rdb`.

To restore Redis, copy the snapshot to `/data/dump.rdb` in the Redis container and restart the Redis service.

## Verification

- Check backend health: `http://localhost:18080/actuator/health`
- Check analytics data: `http://localhost:18080/api/v1/analytics/overview`
- Verify frontend: `http://localhost:5173`
- Verify Kafka topics and consumers

## Load testing

```zsh
./scripts/load-test.sh
```

Review SLO thresholds: HTTP 5xx below 1% and p95 latency below 500 ms.
