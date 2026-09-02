# Content Automation Showcase

> A design and workflow showcase for a multi-client social-content operation. It contains no production application, customer credentials, external Workspace identifiers, generated client output, or task-tracking data.

## Purpose

Content Automation defines a disciplined operator workflow for creating social-content drafts while keeping every client's brand knowledge and Google Workspace resources isolated.

This repository is intentionally an **architecture portfolio**, not a runnable product or deployment claim. It presents the workflow rules, prompt/skill design, safe client configuration shape, and proposed PostgreSQL model.

## Current content workflow

```text
client-config + isolated knowledge
        ↓
Google Sheets content schedule (gws CLI)
        ↓
select incomplete topics
        ↓
generate Script_1 → Script_2 → Script_3
        ↓
optional client-specific image-production brief
        ↓
one Sheets batch update
        ↓
update local queue only after success
```

1. The operator reads `clients/[client]/client-config.md` for post-type restrictions, worksheet layout, and the Google Workspace binding.
2. The orchestrator reads the client's `文案資料庫` through `gws`; completed cells are skipped rather than overwritten.
3. Every selected topic completes the missing `Script_1`–`Script_3` sequence before the next topic begins. Each version uses a distinct content angle.
4. Drafting uses four client-isolated knowledge documents: brand context, product information, target audience, and writing style. Client rules override shared platform rules.
5. If enabled for that client, an image-production guide turns the confirmed copy core into a page-by-page visual brief. Human-edited briefs are never overwritten.
6. New copy and optional briefs are collected into one Google Sheets `values batchUpdate`. The local queue changes only after the batch succeeds.

AI work is operator-led through a subscribed Codex/ChatGPT environment; the design does not assume automated API generation or stored OAuth tokens.

## Architecture reference

```text
Organizations
  └─ Clients
       ├─ versioned knowledge documents
       └─ content jobs

Users ── memberships / roles ── Organizations
                           └─ audit logs
```

The proposed relational model is available in [`architecture/database/schema.sql`](architecture/database/schema.sql). It demonstrates tenant isolation, versioned knowledge, work-queue state, role boundaries, and audit history. It is a schema reference, not an installed database or a released API.

## Google Workspace boundary

The intended internal operator boundary is `gws`:

```bash
gws auth login -s drive,sheets,docs
```

`client-config.md` shows how each client binds its Sheets/Drive resources while all real IDs, URLs, credentials, and logged-in sessions remain outside version control. See [`docs/google-workspace-workflow.md`](docs/google-workspace-workflow.md).

## Included examples

- `clients/Mother Rain/`: the only approved demonstration client; its config uses safe placeholders and its knowledge is approved for display.
- `skills/`: workflow definitions for generation, drafting, research, Sheets reads, and synchronization.
- `templates/image-production-guide.md`: a generic brief template, not a customer's visual playbook.
- `specs/`: product rules and proposed data-model documentation.
- `docs/`: architecture rationale, repository map, Workspace boundary, and data boundary.

## Deliberate limits

- No frontend, backend, database instance, deployment configuration, API contract, or self-service interface is included.
- IG is the currently demonstrated content output; FB remains a future consideration.
- No live Google Workspace, external service, client schedule, generated output, or secret is included.
