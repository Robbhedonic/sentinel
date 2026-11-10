# frontend-react

React + TypeScript dashboard for Sentinel.

## Current features

- Analytics overview cards
- Recent transactions table
- Recent fraud alerts table
- Filters by account, risk level, and alert status
- Pagination controls for transactions and alerts
- Manual refresh and auto-refresh every 15 seconds

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
