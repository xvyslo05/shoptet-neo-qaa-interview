# Czech Name-Day Lookup

A small Czech name-day (svátek) lookup application used for interviewing QA Automation candidates.

## What it does

The app looks up the Czech civil name-day calendar in both directions:

- Enter a date to see every first name celebrating on that day.
- Enter a first name to see its date or dates in the calendar.

Dates can be entered in common Czech numeric forms or selected with the native date picker. Name matching ignores surrounding whitespace, letter case, and diacritics.

## Stack

- **Backend:** TypeScript on Node.js 22 with Express, split into a pure calendar engine and a thin HTTP API in `backend/`.
- **Frontend:** React 19, Vite, TypeScript, and plain CSS in `frontend/`.
- **API definition:** OpenAPI-first YAML in `contracts/openapi.yaml`.
- **Repository:** Plain npm workspaces, with the Node version pinned in `.nvmrc`.

## Run locally

Install the workspace packages and start the backend and frontend together:

```sh
npm install
npm run dev
```

The frontend is available at `http://localhost:5173` and proxies API requests to the Express server on port 3000.

## Deployment

The app is published as a **GitHub Pages** site, built and deployed by GitHub Actions.

GitHub Pages serves static files only, so the deployed build has no running Node server. The same backend name-day engine is imported by an MSW (Mock Service Worker) handler and runs in the browser. The frontend uses the same API response shapes locally through Express and on the published page through the service worker, keeping the network interaction visible in both environments.
