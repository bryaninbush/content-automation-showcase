# Project Map

This project has two product layers: content workflow and web/API runtime. Specifications document the intended behavior of both.

## Product Workflow

These paths are the original content automation product:

- `CLAUDE.md`: product command entry point and core generation rules.
- `clients/`: client-specific configuration, local queue backup, and knowledge.
- `skills/`: command workflows for generation, research, Sheets reading, and sync.
- `shared/`: reusable content and platform guidance.

The product workflow centers on Google Workspace and `gws`.

## Web/API Runtime

These paths support the browser dashboard and backend queue:

- `apps/web/`: static frontend dashboard.
- `apps/server/`: Bun server, HTTP API, PostgreSQL repository, auth/RBAC, smoke tests.
- `packages/core/`: shared roles, permissions, auth parsing, and job/knowledge enums.
- `packages/gws-runner/`: controlled gws operator instruction helpers.
- `package.json`, `bun.lock`, `tsconfig.base.json`: Bun monorepo tooling.

Current queue model: PostgreSQL `content_jobs` table. A heavier queue service is not needed yet.

## Specifications

- `specs/`: source of truth for product rules, API contract, data model, and errors.

## Deployment / Hosting

These paths are for future online deployment:

- `Dockerfile`: container build used by Cloud Run or similar hosts.
- `cloudrun/`: Cloud Run service examples.
- `docs/deployment-cloud-run.md`: Cloud Run/IAP deployment notes.
- `docs/iap-setup-checklist.md`: Google IAP setup checklist.
- `docker-compose.yml`: optional local PostgreSQL fallback, not the preferred daily path.

PostgreSQL is the database target. Docker Compose is included only as a local architecture reference.
