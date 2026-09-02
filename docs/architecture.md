# Architecture Reference

## Design goal

The proposed system supports internal multi-client content operations without mixing brand knowledge, schedules, or Google Workspace resources between clients.

## Workflow boundary

```text
Client configuration and knowledge
        ↓
Operator + Codex/ChatGPT workflow
        ↓
gws CLI reads and batch-writes Google Workspace surfaces
        ↓
Local queue reflects only confirmed write results
```

The AI step is manual and operator-led. Google Sheets, Docs, and Drive are collaboration surfaces; their credentials and IDs stay outside the repository.

## Proposed data model

- An `organization` owns multiple `clients`.
- A `user` joins an organization through a `membership` with a role.
- A `client` owns versioned `knowledge_documents` and `content_jobs`.
- `audit_logs` record future mutations.

The reference SQL schema is in [`../architecture/database/schema.sql`](../architecture/database/schema.sql). It is included to communicate the intended tenant boundary and evolution path, not to claim an implemented database service.

## Non-goals of this repository

- Hosted application, API, or deployment configuration.
- Automated model execution or stored Google OAuth tokens.
- Customer data management or external user onboarding.
