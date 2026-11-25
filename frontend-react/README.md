# frontend-react

React + TypeScript dashboard for Sentinel.

## Current features

- Analytics overview cards
- Recent transactions table
- Recent fraud alerts table
- Filters by account, risk level, and alert status
- Pagination controls for transactions and alerts
- Sorting controls for risk score, amount, and timestamps
- Manual refresh and auto-refresh every 15 seconds
- Clickable fraud alert investigation panel with finding rules and reasons
- Alert actions: start review, dismiss, or confirm fraud

## Fraud alert statuses

- `OPEN`
- `UNDER_REVIEW`
- `DISMISSED`
- `CONFIRMED_FRAUD`

## Run locally

```bash
npm install
npm run dev
```

## Backend API base URL

The dashboard reads `VITE_API_BASE_URL` and defaults to:

`http://localhost:18080/api/v1`

Example:

```bash
VITE_API_BASE_URL=http://localhost:18080/api/v1 npm run dev
```

## Browser tests

Run the Playwright smoke suite:

```bash
npx playwright install chromium
npm run test:e2e
```

Open Playwright UI:

```bash
npm run test:e2e:ui
```
