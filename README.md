# SENTINEL

**Real-Time Financial Intelligence & Fraud Detection Platform**

Sentinel is a production-inspired distributed system that simulates financial transactions, evaluates fraud risk in real time, and enables analyst investigation workflows through a modern dashboard.

This is a **portfolio project** focused on depth: systems design, low-level programming, event-driven architecture, backend engineering, observability, and cloud-ready infrastructure.

## Project Goals

Sentinel is designed to demonstrate practical, interview-relevant engineering skills across:

- C (transaction simulation)
- C++ (real-time risk scoring engine)
- Java + Spring Boot (business backend and REST API)
- React + TypeScript (analyst dashboard)
- Apache Kafka (event streaming backbone)
- PostgreSQL + Redis (persistence and low-latency state)
- Docker + Docker Compose (local orchestration)
- Terraform + AWS-ready architecture (future deployment)
- GitHub Actions (CI/CD)
- Prometheus + Grafana (observability)

## Scope and Disclaimer

Sentinel is a simulation platform using fictional data. It is **not** a real banking system, does not move money, and should not be used for real financial decision-making.

Risk rules are intentionally explainable and educational, not regulatory-grade fraud models.

## High-Level Architecture

```mermaid
flowchart LR
  A[C Transaction Simulator] --> B[Kafka: transactions.raw]
  B --> C[C++ Fraud Detection Engine]
  C --> D[Kafka: transactions.scored]
  C --> E[Kafka: alerts.generated]
  D --> F[Java Spring Boot Backend]
  E --> F
  F --> G[(PostgreSQL)]
  F --> H[(Redis)]
  F --> I[REST API]
  I --> J[React + TypeScript Dashboard]

  F --> K[/metrics]
  C --> L[/metrics]
  A --> M[/metrics]
  K --> N[Prometheus]
  L --> N
  M --> N
  N --> O[Grafana]
```

## Service Responsibilities

### 1) C Transaction Simulator

- Generates fictional customers, accounts, transfers, and payments
- Produces both normal and suspicious behavior patterns
- Publishes JSON events to Kafka
- Supports configurable throughput for stress scenarios

### 2) C++ Fraud Detection Engine

- Consumes raw transaction events
- Applies explainable rule-based scoring (0-100)
- Emits scored transactions and fraud alerts to Kafka
- Targets low-latency event processing with multithreaded design

### 3) Java Spring Boot Backend

- Consumes scored events and alerts
- Manages transactions, alerts, investigations, users, and audit logs
- Exposes REST API for dashboard and operational tooling
- Handles authentication (JWT) and role-based authorization

### 4) React + TypeScript Dashboard

- Overview KPIs and system status
- Transaction monitoring with filters
- Fraud alert triage and investigation workflows
- Analytics and trend visualization

## Initial Fraud Rules (Explainable)

- **High Amount**: unusually large transfer amount
- **Velocity Check**: too many transactions in a short window
- **Geographic Anomaly**: incompatible geolocation changes in short intervals
- **New Recipient Burst**: many unknown recipients quickly
- **Behavior Deviation**: activity diverges from historical baseline

Each event receives a score from 0 to 100, with rule-level contribution details.

## Target Repository Structure

```text
sentinel/
├── simulator-c/
│   ├── src/
│   ├── include/
│   ├── tests/
│   ├── CMakeLists.txt
│   └── Dockerfile
├── fraud-engine-cpp/
│   ├── src/
│   │   ├── detection/
│   │   ├── rules/
│   │   ├── scoring/
│   │   └── messaging/
│   ├── include/
│   ├── tests/
│   ├── CMakeLists.txt
│   └── Dockerfile
├── backend-java/
│   ├── src/
│   │   ├── main/
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
├── frontend-react/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── package.json
│   └── Dockerfile
├── infrastructure/
│   ├── docker/
│   │   └── docker-compose.yml
│   └── monitoring/
│       ├── prometheus/
│       └── grafana/
├── terraform/
│   ├── modules/
│   ├── environments/
│   │   ├── dev/
│   │   └── production/
│   └── README.md
├── .github/
│   └── workflows/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   └── decisions/
├── README.md
└── LICENSE
```

## Development Roadmap

1. Architecture and repository bootstrap
2. C transaction simulator
3. C++ fraud detection engine
4. Kafka integration and end-to-end event flow
5. Docker Compose local platform
6. Java Spring Boot backend
7. PostgreSQL + Redis integration
8. React + TypeScript dashboard
9. Testing + security hardening
10. Prometheus + Grafana observability
11. Terraform AWS infrastructure definition
12. CI/CD completion and portfolio polishing

## macOS (zsh) Prerequisites

Install core tools:

```zsh
xcode-select --install
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install gcc cmake temurin@21 maven node terraform gh jq kcat
```

Install and start Docker Desktop (required for local stack).

Validate installation:

```zsh
docker --version
java -version
mvn -v
node -v
npm -v
cmake --version
terraform -version
gh --version
```

## Local-First Principle

Development starts fully local and free of cloud cost. No paid AWS resources should be provisioned without explicit approval.

## Milestone 1 (Current Focus)

**Foundation & Local Platform Bootstrap**

Deliverables:

- Baseline repository structure
- Docker Compose stack (Kafka, PostgreSQL, Redis, Prometheus, Grafana)
- Service skeletons for C, C++, Java, and React
- Environment variable conventions and sample config
- Initial CI workflows (build and smoke checks)
- Initial architecture docs and ADRs

Acceptance criteria:

- One-command local startup
- Ability to publish and consume a test Kafka event
- Backend health endpoint responds
- Frontend starts successfully
- Prometheus scrapes at least one target

## Phase 1 Quickstart

Bootstrap scripts available:

- `scripts/dev-up.sh`: starts Kafka, PostgreSQL, Redis, Prometheus, and Grafana
- `scripts/dev-test.sh`: smoke tests ports and health endpoints
- `scripts/dev-down.sh`: stops the base platform

Run:

```zsh
./scripts/dev-up.sh
./scripts/dev-test.sh
```

Stop:

```zsh
./scripts/dev-down.sh
```

If you get `Cannot connect to the Docker daemon`, open Docker Desktop and wait until Docker is fully running, then execute the scripts again.

## Quality Standards

- Clear service boundaries and single-responsibility modules
- Secure defaults: no hardcoded secrets
- Structured logging and measurable metrics
- Automated tests at each layer
- Reproducible builds and deterministic local setup

## Portfolio Outcomes

By the end of this project, you should be able to demonstrate:

- Event-driven distributed architecture design
- Systems programming (C/C++) in a practical business scenario
- Production-style Java backend engineering
- Real-time dashboard product thinking
- Observability and performance-driven optimization
- Infrastructure as code and CI/CD maturity

## Suggested Performance Metrics

Track these from early iterations:

- Transactions per second (TPS)
- End-to-end latency (generation to risk score publication)
- Kafka consumer lag
- API p95 response time
- Error rate per service

## License

To be defined (`LICENSE`).
