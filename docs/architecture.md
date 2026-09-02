# Content Automation Web App Architecture

## Current direction

This web app is an internal operations layer for the existing content automation workflow.

- Deployment target: Google Cloud Run behind Identity-Aware Proxy (IAP).
- Runtime: Bun.
- AI execution: manual queue handled by a subscribed Codex/ChatGPT operator, not OpenAI API billing.
- Google Workspace operations: keep `gws` as the operator tool.
- Knowledge storage: database first; Google Drive/Docs as import/export and human-readable sources.
- Figma: pending.

## Apps and packages

- `apps/web`: static internal UI served by the Bun backend.
- `apps/server`: Bun HTTP server, IAP user parsing, RBAC, clients, and jobs.
- `packages/core`: shared roles, permissions, job status, IAP parsing.
- `packages/gws-runner`: controlled wrapper and instructions for `gws`.
- `apps/server/src/db`: PostgreSQL schema and repository for local/prod parity.

## Authentication and authorization

Cloud Run should be protected by IAP. The server reads:

- `x-goog-authenticated-user-email`
- `x-goog-authenticated-user-id`

Local development can pass `x-dev-user-email`; this is disabled when `NODE_ENV=production`.

App-level RBAC is stored in DB:

- `owner`: members, settings, clients, knowledge, jobs.
- `editor`: clients, knowledge, jobs.
- `viewer`: read-only clients, knowledge, jobs.

Do not use JSON files for production permissions. JSON is acceptable only for local seed data or fixtures.

## Knowledge storage

Use PostgreSQL as the source of truth for multi-account or commercial use:

- Strong tenant isolation.
- Version history.
- Audit logs.
- Queryable knowledge for generation jobs.

Google Drive/Docs remain useful for importing client source material, exporting readable copies, and attaching source documents through Picker.

## AI job flow

1. User opens the IAP-protected web app.
2. User selects a client and creates a content job.
3. Job is stored as `queued`.
4. A human operator with a subscribed Codex/ChatGPT account processes the job.
5. Operator uses `gws auth login -s drive,sheets,docs` in a controlled environment.
6. Operator writes results back to Google Workspace through `gws`.
7. Operator marks the job `done` or `failed`.

This keeps the product aligned with the no-OpenAI-API-billing requirement.
