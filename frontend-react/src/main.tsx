import React from "react";
import { createRoot } from "react-dom/client";
import DashboardPremium from "./DashboardPremium";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DashboardPremium />
  </React.StrictMode>
);
