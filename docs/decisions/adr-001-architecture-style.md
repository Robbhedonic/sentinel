# ADR-001: Event-Driven Architecture with Kafka

## Status
Accepted

## Context
Sentinel requires decoupled producers and consumers, scalable processing, and replayable event flows.

## Decision
Use Apache Kafka as the asynchronous event backbone between simulator, risk engine, and backend.

## Consequences
- Services remain loosely coupled.
- Throughput and scalability improve.
- Operational complexity increases compared to direct sync APIs.
