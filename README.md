# Content Automation Showcase

> An architecture showcase for a multi-client social-content workflow. This repository contains no customer credentials, Google Workspace identifiers, production data, or operational task-tracking data.

## What this project demonstrates

Content Automation is designed for internal marketing operations. It keeps each client's brand knowledge and content workflow separate, coordinates an operator-led AI drafting process, and uses Google Workspace as the collaboration surface.

This repository demonstrates the product architecture and workflow. It is not presented as a public SaaS product, a deployed service, or a self-serve tool.

## Current workflow

```text
client-config + isolated knowledge
        ↓
Google Sheets content schedule (via gws CLI)
        ↓
select incomplete topics and generate Script_1–3
        ↓
optional client-specific image production brief
        ↓
one Google Sheets batch update
        ↓
update the local queue only after the batch succeeds
```

1. An operator reads `clients/[client]/client-config.md` to obtain the allowed post types, worksheet layout, and Google Workspace binding.
2. The orchestrator reads the client's `文案資料庫` through `gws`. A row is eligible only when its tag and topic are present; completed script columns are never overwritten.
3. For each selected topic, the workflow completes the missing versions in order: `Script_1`, `Script_2`, then `Script_3`. Each version uses a deliberately different content angle.
4. The workflow reads four isolated knowledge documents: brand context, product information, target audience, and writing style. Shared platform rules are applied only after the client rules.
5. When a client has enabled an image-production guide, the approved copy core is transformed into a page-by-page visual brief. It specifies page count, cover, message hierarchy, assets/visual direction, and CTA. It is client-specific and must not overwrite a human-edited brief.
6. All newly generated scripts and optional image briefs are collected and written to Google Sheets with one `values batchUpdate`. The local queue is marked complete only after that batch write succeeds.

The AI step is operator-led using a subscribed Codex/ChatGPT environment. This design intentionally does not embed automated OpenAI API generation, OAuth tokens, or customer credentials in the product.

## Architecture

```text
Browser dashboard
      ↓
Bun HTTP API + IAP-aware authentication + RBAC
      ↓
PostgreSQL: organizations / users / memberships / clients
            knowledge_documents / content_jobs / audit_logs
      ↓
Human operator uses gws CLI with Google Sheets, Docs, and Drive
```

The PostgreSQL schema models tenant separation, versioned knowledge, work-queue state, and audit history. Google Workspace remains the human-readable collaboration surface; the system does not store Google OAuth tokens.

## Showcase data boundary

`Mother Rain` is the only approved demonstration client. Its checked-in `client-config.md` preserves the Google Workspace integration shape—worksheet name, column mapping, allowed tags, and `gws` workflow—while replacing Spreadsheet ID, Drive folder, and URL with `[NOT_COMMITTED]` placeholders.

The showcase intentionally excludes client schedules, generated output, external service IDs, deployment secrets, and task-management data. The generic image-production guide is a template, not a copy of any customer's visual rules.

## Repository map

- `clients/Mother Rain/`: approved example config and isolated brand knowledge.
- `skills/`: workflows for generation, drafting, research, Sheets reads, and sync/setup.
- `templates/image-production-guide.md`: generic brief format for clients that opt into image planning.
- `shared/`: reusable platform guidance.
- `apps/web/` and `apps/server/`: dashboard and Bun API reference implementation.
- `packages/core/`: roles, permissions, status types, and authentication helpers.
- `packages/gws-runner/`: controlled `gws` command boundary.
- `apps/server/src/db/schema.sql`: PostgreSQL data model.
- `specs/` and `docs/`: API, data, security, and deployment design notes.

## Google Workspace boundary

The internal workflow uses `gws` as an operator tool:

```bash
gws auth login -s drive,sheets,docs
```

No logged-in session, Spreadsheet ID, Drive folder ID, OAuth credential, or API token is included here. In a real internal environment, those values are supplied through approved local or deployment configuration and are never committed.

## Scope and known limits

- Current content output is IG-focused; FB remains a product consideration, not a demonstrated implementation.
- The dashboard/API is a reference implementation of the internal workflow, not a released multi-user product.
- Cloud Run + IAP is the intended production access model; this repository does not claim a live deployment.
- There is no automated model execution, Google Picker, membership-management UI, migration runner, or external self-service onboarding.

## Verification

The codebase's current static verification command is:

```bash
bun run check
```

Before publishing a showcase revision, review the staged diff for identifiers and client data in addition to running the check.
