# Data Model

Database target: PostgreSQL.

## Tenancy

- `organizations` own clients.
- `users` can belong to organizations through `memberships`.
- `memberships.role` controls app permissions.
- Every client, knowledge, and job query must be scoped to an organization reachable by the authenticated user.

## Tables

- `organizations`: tenant account.
- `users`: authenticated person, keyed by email and Google subject.
- `memberships`: user-to-organization role mapping.
- `clients`: customer account inside an organization.
- `knowledge_documents`: versioned client knowledge.
- `content_jobs`: operator work queue.
- `audit_logs`: mutation history.

## Roles

- `owner`: members, settings, clients, knowledge, jobs.
- `editor`: clients, knowledge, jobs.
- `viewer`: read-only clients, knowledge, jobs.

## Knowledge Types

- `brand-context`
- `product-info`
- `target-audience`
- `writing-style`

## Job Statuses

- `queued`
- `in_progress`
- `waiting_review`
- `done`
- `failed`

## Audit Requirements

Mutations must write audit logs for:

- client create/update/delete when implemented
- knowledge create/update/delete when implemented
- job create/status update
- membership changes when implemented

## Runtime Config

- `DATABASE_URL` is required for PostgreSQL.
- `DATABASE_POOL_MAX` controls connection pool max.
- `BOOTSTRAP_OWNER_EMAIL` seeds the first owner during DB init.
- `PORT` controls the HTTP server port.
