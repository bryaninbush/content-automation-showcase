# Product Rules

## Scope

Content Automation is an internal operations app for managing client knowledge, content jobs, and Google Workspace operator workflows.

## Product Rules

- `PR-001`: All generated marketing copy uses Traditional Chinese for Taiwan.
- `PR-002`: Social content targets IG and FB. TikTok is out of scope until a future approved spec.
- `PR-003`: Client knowledge is isolated by organization and client.
- `PR-004`: Database records are the source of truth for multi-account knowledge, clients, jobs, RBAC, and audit history.
- `PR-005`: Google Drive/Docs/Sheets are import/export and human-readable collaboration surfaces.
- `PR-006`: AI execution is manual/operator-driven through subscribed Codex/ChatGPT usage; the MVP must not call OpenAI APIs for generation.
- `PR-007`: Google Workspace operations use `gws`; operator login command is `gws auth login -s drive,sheets,docs`.
- `PR-008`: Generated Sheets writes must be batched. Do not write each script cell one by one.
- `PR-009`: Port `5173` is reserved for another local project; use `3000` or another non-5173 port.

## Current Product Flow

1. User enters the IAP-protected internal app.
2. User manages clients and knowledge.
3. User creates a content job.
4. Operator processes the job with subscribed Codex/ChatGPT and `gws`.
5. Operator writes results back to Google Workspace.
6. Operator updates the job status in the app.

## Out Of Scope

- Automated OpenAI API generation.
- Storing Google OAuth tokens in the app DB.
- Full Google Picker implementation before OAuth client details are approved.
- Multi-page frontend navigation before Milestone 3.3.
