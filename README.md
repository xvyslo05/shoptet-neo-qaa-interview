# QAA Interview Calculator

A small calculator application used for interviewing QA Automation candidates.

## What it is

A calculator supporting `+`, `-`, `*`, `/`, `C` (clear all) and `CE` (clear entry), built with:

- **Backend:** TypeScript (Node.js 22, Express) — pure calculation engine + thin HTTP API — `backend/`
- **Frontend:** React 19 + Vite, TypeScript — `frontend/`
- **Contract tests:** OpenAPI-first, spec in `contracts/openapi.yaml` — `contracts/`
- **E2E tests:** Cypress, against the local dev server — `e2e/`

The repo is a plain npm-workspaces monorepo. Local dev: `npm install` + `npm run dev` (no Docker). Node version is pinned in `.nvmrc`.

## Deployment

The app is published as a **GitHub Pages** site, built and deployed by GitHub Actions.

GitHub Pages serves static files only, so the deployed build has no running server: the same backend calculation engine is served in-browser by an MSW (Mock Service Worker) service worker. The frontend always talks to the same HTTP contract (`/api/...`) — locally and in CI against a real Node server, on the live page against the service worker — so API traffic stays real and inspectable everywhere.

## Status

**Not implemented yet.** The repository is being prepared; remaining open design questions are tracked in [DECISIONS.md](DECISIONS.md).

## Test levels

The project intentionally ships with an incomplete test suite across four levels:

1. Backend unit tests (Vitest)
2. Frontend component tests (Vitest)
3. Contract tests (frontend ↔ backend API)
4. End-to-end tests (Cypress)

Part of the interview exercise is for the candidate to assess the current coverage and propose improvements.

## Decision log

Every decision made during development — by humans or AI — is recorded in [DECISIONS.md](DECISIONS.md).
