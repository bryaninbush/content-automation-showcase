# Security Notes

## Principles

- Google IAP protects the app before requests reach the server.
- DB RBAC protects app actions after authentication.
- Google Workspace OAuth scopes must be minimal.
- Secrets do not live in repo or normal env files.
- All mutation actions are audit logged.

## B2B-style account model

Use organization-based tenancy:

- One user can belong to many organizations.
- One organization owns many clients.
- Clients own knowledge and jobs.
- Every query must filter by organization membership.

Roles:

- Owner: billing/settings/members plus all editor permissions.
- Editor: manage clients, knowledge, jobs.
- Viewer: read-only.

This is the normal model used by many B2B SaaS products because it separates identity, tenancy, and permissions.

## Known MVP gaps

- No migration runner yet; schema init currently executes `apps/server/src/db/schema.sql`.
- No membership management UI yet.
- No Google Picker implementation yet.
- No automated Codex execution by design.
- `gws auth login` remains an operator flow.
