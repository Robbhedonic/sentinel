import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "30s", target: 20 },
    { duration: "10s", target: 0 }
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

const BASE_URL = __ENV.SENTINEL_BASE_URL || "http://host.docker.internal:18080";

export default function () {
  const overview = http.get(`${BASE_URL}/api/v1/analytics/overview`);
  check(overview, {
    "overview status is 200": (r) => r.status === 200,
    "overview has JSON": (r) => r.headers["Content-Type"]?.includes("application/json")
  });

  const transactions = http.get(`${BASE_URL}/api/v1/transactions?page=0&size=8&sortBy=processedAt&sortDir=desc`);
  check(transactions, {
    "transactions status is 200": (r) => r.status === 200
  });

  const alerts = http.get(`${BASE_URL}/api/v1/fraud-alerts?page=0&size=8&sortBy=createdAt&sortDir=desc`);
  check(alerts, {
    "alerts status is 200": (r) => r.status === 200
  });

  sleep(0.2);
}
