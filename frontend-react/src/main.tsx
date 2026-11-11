import React from "react";
import { createRoot } from "react-dom/client";

type CountryCount = {
  country: string;
  count: number;
};

type AnalyticsOverview = {
  transactionsTotal: number;
  alertsTotal: number;
  openAlerts: number;
  averageRiskScore: number;
  averageAmount: number;
  topCountries: CountryCount[];
};

type Transaction = {
  transactionId: string;
  accountId: string;
  recipientId: string;
  amount: number;
  currency: string;
  transactionType: string;
  country: string;
  transactionTimestamp: string;
  simulatedPattern: string;
  riskScore: number;
  riskLevel: string;
  processedAt: string;
};

type FraudAlert = {
  alertId: string;
  transactionId: string;
  accountId: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  findingsJson: string;
  createdAt: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:18080/api/v1";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}

function App() {
  const pageSize = 8;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [alerts, setAlerts] = React.useState<FraudAlert[]>([]);
  const [transactionsTotal, setTransactionsTotal] = React.useState(0);
  const [alertsTotal, setAlertsTotal] = React.useState(0);
  const [transactionsPage, setTransactionsPage] = React.useState(0);
  const [alertsPage, setAlertsPage] = React.useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = React.useState(1);
  const [alertsTotalPages, setAlertsTotalPages] = React.useState(1);
  const [transactionsSortBy, setTransactionsSortBy] = React.useState("processedAt");
  const [transactionsSortDir, setTransactionsSortDir] = React.useState("desc");
  const [alertsSortBy, setAlertsSortBy] = React.useState("createdAt");
  const [alertsSortDir, setAlertsSortDir] = React.useState("desc");
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [draftFilters, setDraftFilters] = React.useState({
    accountId: "",
    riskLevel: "",
    status: ""
  });
  const [filters, setFilters] = React.useState(draftFilters);

  const loadDashboard = React.useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      try {
        const txParams = new URLSearchParams({
          page: String(transactionsPage),
          size: String(pageSize),
          sortBy: transactionsSortBy,
          sortDir: transactionsSortDir
        });
        const alertParams = new URLSearchParams({
          page: String(alertsPage),
          size: String(pageSize),
          sortBy: alertsSortBy,
          sortDir: alertsSortDir
        });

        if (filters.accountId.trim()) {
          txParams.set("accountId", filters.accountId.trim());
          alertParams.set("accountId", filters.accountId.trim());
        }

        if (filters.riskLevel) {
          txParams.set("riskLevel", filters.riskLevel);
          alertParams.set("riskLevel", filters.riskLevel);
        }

        if (filters.status) {
          alertParams.set("status", filters.status);
        }

        const [overviewData, transactionsResponse, alertsResponse] = await Promise.all([
          getJson<AnalyticsOverview>("/analytics/overview"),
          getJson<PageResponse<Transaction>>(`/transactions?${txParams.toString()}`),
          getJson<PageResponse<FraudAlert>>(`/fraud-alerts?${alertParams.toString()}`)
        ]);

        setOverview(overviewData);
        setTransactions(transactionsResponse.content);
        setTransactionsTotal(transactionsResponse.totalElements);
        setTransactionsTotalPages(
          Math.max(
            transactionsResponse.totalPages ??
              Math.ceil(transactionsResponse.totalElements / pageSize),
            1
          )
        );
        setAlerts(alertsResponse.content);
        setAlertsTotal(alertsResponse.totalElements);
        setAlertsTotalPages(
          Math.max(
            alertsResponse.totalPages ?? Math.ceil(alertsResponse.totalElements / pageSize),
            1
          )
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [
      alertsPage,
      alertsSortBy,
      alertsSortDir,
      filters,
      transactionsPage,
      transactionsSortBy,
      transactionsSortDir
    ]
  );

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  React.useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadDashboard(true);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadDashboard]);

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1rem",
    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)"
  };

  return (
    <main
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        padding: "2rem",
        background: "#f8fafc",
        color: "#0f172a",
        minHeight: "100vh"
      }}
    >
      <h1 style={{ marginTop: 0 }}>Sentinel Dashboard</h1>
      <p style={{ marginTop: 0 }}>
        Live data from backend API: <code>{API_BASE_URL}</code>
      </p>

      <section style={{ ...cardStyle, marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Filters</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginBottom: "0.75rem"
          }}
        >
          <input
            type="text"
            placeholder="Account ID"
            value={draftFilters.accountId}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                accountId: event.target.value
              }))
            }
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          />

          <select
            value={draftFilters.riskLevel}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                riskLevel: event.target.value
              }))
            }
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          >
            <option value="">Risk Level: Any</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>

          <select
            value={draftFilters.status}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                status: event.target.value
              }))
            }
            style={{ padding: "0.5rem", borderRadius: 8, border: "1px solid #cbd5e1" }}
          >
            <option value="">Alert Status: Any</option>
            <option value="OPEN">OPEN</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="DISMISSED">DISMISSED</option>
            <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => {
              setTransactionsPage(0);
              setAlertsPage(0);
              setFilters(draftFilters);
            }}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid #2563eb", background: "#2563eb", color: "#fff" }}
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => {
              const reset = { accountId: "", riskLevel: "", status: "" };
              setDraftFilters(reset);
              setTransactionsPage(0);
              setAlertsPage(0);
              setFilters(reset);
            }}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            style={{ padding: "0.5rem 0.9rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
          >
            Refresh now
          </button>
          <label style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(event) => setAutoRefresh(event.target.checked)}
            />
            Auto-refresh (15s)
          </label>
        </div>
      </section>

      {loading && <p>Loading dashboard...</p>}
      {error && (
        <p style={{ color: "#b91c1c", fontWeight: 600 }}>
          Error loading data: {error}
        </p>
      )}

      {overview && !loading && !error && (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem"
          }}
        >
          <article style={cardStyle}>
            <strong>Transactions</strong>
            <div style={{ fontSize: "1.5rem", marginTop: ".5rem" }}>
              {overview.transactionsTotal}
            </div>
          </article>
          <article style={cardStyle}>
            <strong>Alerts</strong>
            <div style={{ fontSize: "1.5rem", marginTop: ".5rem" }}>
              {overview.alertsTotal}
            </div>
          </article>
          <article style={cardStyle}>
            <strong>Open Alerts</strong>
            <div style={{ fontSize: "1.5rem", marginTop: ".5rem" }}>
              {overview.openAlerts}
            </div>
          </article>
          <article style={cardStyle}>
            <strong>Avg Risk Score</strong>
            <div style={{ fontSize: "1.5rem", marginTop: ".5rem" }}>
              {overview.averageRiskScore.toFixed(2)}
            </div>
          </article>
          <article style={cardStyle}>
            <strong>Avg Amount</strong>
            <div style={{ fontSize: "1.5rem", marginTop: ".5rem" }}>
              {Number(overview.averageAmount).toLocaleString()}
            </div>
          </article>
          <article style={cardStyle}>
            <strong>Top Countries</strong>
            <div style={{ marginTop: ".5rem", lineHeight: 1.5 }}>
              {overview.topCountries.map((entry) => (
                <div key={`${entry.country}-${entry.count}`}>
                  {entry.country}: {entry.count}
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      <section style={{ display: "grid", gap: "1.5rem" }}>
        <article style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Recent Transactions ({transactionsTotal})</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}
          >
            <span>
              Page {transactionsPage + 1} of {transactionsTotalPages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select
                value={transactionsSortBy}
                onChange={(event) => {
                  setTransactionsPage(0);
                  setTransactionsSortBy(event.target.value);
                }}
                style={{ padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                <option value="processedAt">Sort: Processed At</option>
                <option value="riskScore">Sort: Risk Score</option>
                <option value="amount">Sort: Amount</option>
                <option value="transactionTimestamp">Sort: Tx Timestamp</option>
              </select>
              <select
                value={transactionsSortDir}
                onChange={(event) => {
                  setTransactionsPage(0);
                  setTransactionsSortDir(event.target.value);
                }}
                style={{ padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                <option value="desc">DESC</option>
                <option value="asc">ASC</option>
              </select>
              <button
                type="button"
                disabled={transactionsPage === 0}
                onClick={() => setTransactionsPage((current) => Math.max(0, current - 1))}
                style={{ padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={transactionsPage + 1 >= transactionsTotalPages}
                onClick={() =>
                  setTransactionsPage((current) =>
                    Math.min(transactionsTotalPages - 1, current + 1)
                  )
                }
                style={{ padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                Next
              </button>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Tx</th>
                <th align="left">Account</th>
                <th align="right">Amount</th>
                <th align="left">Risk</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.transactionId}>
                  <td>{tx.transactionId}</td>
                  <td>{tx.accountId}</td>
                  <td align="right">
                    {tx.amount} {tx.currency}
                  </td>
                  <td>{tx.riskLevel}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4}>No transactions found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>

        <article style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Recent Fraud Alerts ({alertsTotal})</h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              gap: "0.5rem",
              flexWrap: "wrap"
            }}
          >
            <span>
              Page {alertsPage + 1} of {alertsTotalPages}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <select
                value={alertsSortBy}
                onChange={(event) => {
                  setAlertsPage(0);
                  setAlertsSortBy(event.target.value);
                }}
                style={{ padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                <option value="createdAt">Sort: Created At</option>
                <option value="riskScore">Sort: Risk Score</option>
              </select>
              <select
                value={alertsSortDir}
                onChange={(event) => {
                  setAlertsPage(0);
                  setAlertsSortDir(event.target.value);
                }}
                style={{ padding: "0.35rem 0.5rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                <option value="desc">DESC</option>
                <option value="asc">ASC</option>
              </select>
              <button
                type="button"
                disabled={alertsPage === 0}
                onClick={() => setAlertsPage((current) => Math.max(0, current - 1))}
                style={{ padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={alertsPage + 1 >= alertsTotalPages}
                onClick={() =>
                  setAlertsPage((current) => Math.min(alertsTotalPages - 1, current + 1))
                }
                style={{ padding: "0.35rem 0.7rem", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
              >
                Next
              </button>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Alert</th>
                <th align="left">Account</th>
                <th align="left">Status</th>
                <th align="left">Risk</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.alertId}>
                  <td>{alert.alertId}</td>
                  <td>{alert.accountId}</td>
                  <td>{alert.status}</td>
                  <td>{alert.riskLevel}</td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={4}>No alerts found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
