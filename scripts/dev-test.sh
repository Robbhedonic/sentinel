#!/usr/bin/env zsh
set -euo pipefail

check_url() {
  local name="$1"
  local url="$2"
  local attempts="${3:-20}"
  local wait_seconds="${4:-2}"
  local i=1

  while (( i <= attempts )); do
    if curl -fsS "$url" >/dev/null; then
      echo "[OK] $name -> $url"
      return 0
    fi
    sleep "$wait_seconds"
    ((i++))
  done

  echo "[FAIL] $name -> $url"
  return 1
}

check_port() {
  local name="$1"
  local host="$2"
  local port="$3"

  if nc -z "$host" "$port"; then
    echo "[OK] $name port $port"
  else
    echo "[FAIL] $name port $port"
    return 1
  fi
}

check_port "Kafka" "localhost" 29092
check_port "PostgreSQL" "localhost" 5432
check_port "Redis" "localhost" 6379
check_url "Prometheus" "http://localhost:9090/-/healthy"
check_url "Grafana" "http://localhost:3000/api/health" 30 2

echo "All base platform checks passed."
