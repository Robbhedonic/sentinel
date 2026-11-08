import React from "react";
import { createRoot } from "react-dom/client";

function App() {
  return (
    <main style={{ fontFamily: "ui-sans-serif, system-ui", padding: "2rem" }}>
      <h1>Sentinel Dashboard Skeleton</h1>
      <p>Phase 1 bootstrap complete. Frontend module is ready.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
