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
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [overview, setOverview] = React.useState<AnalyticsOverview | null>(null);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [alerts, setAlerts] = React.useState<FraudAlert[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [overviewData, transactionsPage, alertsPage] = await Promise.all([
          getJson<AnalyticsOverview>("/analytics/overview"),
          getJson<PageResponse<Transaction>>("/transactions?page=0&size=8"),
          getJson<PageResponse<FraudAlert>>("/fraud-alerts?page=0&size=8")
        ]);

        if (!cancelled) {
          setOverview(overviewData);
          setTransactions(transactionsPage.content);
          setAlerts(alertsPage.content);
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

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
          <h2 style={{ marginTop: 0 }}>Recent Transactions</h2>
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
            </tbody>
          </table>
        </article>

        <article style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Recent Fraud Alerts</h2>
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
