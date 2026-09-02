# API Contract

Base path: `/api`

Authentication:

- Production uses Cloud Run IAP headers: `x-goog-authenticated-user-email` and `x-goog-authenticated-user-id`.
- Local development may use `x-dev-user-email` when `NODE_ENV !== "production"`.

## Session And Utility

- `GET /api/health`
  - Public health check.
  - Returns `{ ok, service }`.
- `GET /api/me`
  - Requires authenticated organization membership.
  - Returns `{ user, organizationId, role }`.
- `GET /api/gws/login-instruction`
  - Returns operator login instruction for `gws`.

## Clients

- `GET /api/clients`
  - Permission: `client:read`.
  - Returns clients scoped to the current organization.
- `POST /api/clients`
  - Permission: `client:write`.
  - Body: `{ name, googleFolderId?, sheetId? }`.
  - Creates a client in the current organization.
  - Writes audit log `client.create`.

## Knowledge

- `GET /api/clients/:clientId/knowledge`
  - Permission: `knowledge:read`.
  - Returns latest knowledge document per type for the scoped client.
- `GET /api/clients/:clientId/knowledge/:type`
  - Permission: `knowledge:read`.
  - Returns latest knowledge document for the scoped client and type.
- `POST /api/clients/:clientId/knowledge`
  - Permission: `knowledge:write`.
  - Body: `{ type, content, sourceFileId? }`.
  - Valid types: `brand-context`, `product-info`, `target-audience`, `writing-style`.
  - Creates a new version; never overwrites prior versions.
  - Writes audit log `knowledge.create`.

## Jobs

- `GET /api/jobs`
  - Permission: `job:read`.
  - Returns jobs scoped by current organization through client ownership.
- `POST /api/jobs`
  - Permission: `job:create`.
  - Body: `{ clientId, scope, rows?, notes? }`.
  - Valid current scopes: `selected`, `non-product`, `all`.
  - Creates status `queued`.
  - Writes audit log `job.create`.
- `PATCH /api/jobs/:jobId/status`
  - Permission: `job:update`.
  - Body: `{ status, resultLinks?, errorMessage? }`.
  - Valid statuses: `queued`, `in_progress`, `waiting_review`, `done`, `failed`.
  - Must be scoped to current organization.
  - Writes audit log `job.status.update`.

## Compatibility Rules

- All resource reads and mutations must be organization-scoped.
- Unknown scoped resources return 404.
- API errors follow `specs/error-codes.md`.
