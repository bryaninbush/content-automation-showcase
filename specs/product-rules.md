# Product Rules

## Scope

Content Automation is an internal operations workflow for managing client knowledge, content jobs, and Google Workspace operator work.

## Product Rules

- `PR-001`: All generated marketing copy uses Traditional Chinese for Taiwan.
- `PR-002`: Social content targets IG and FB. TikTok is out of scope until a future approved spec.
- `PR-003`: Client knowledge is isolated by organization and client.
- `PR-004`: Database records are the source of truth for multi-account knowledge, clients, jobs, RBAC, and audit history.
- `PR-005`: Google Drive/Docs/Sheets are import/export and human-readable collaboration surfaces.
- `PR-006`: AI execution is manual/operator-driven through subscribed Codex/ChatGPT usage; the MVP must not call OpenAI APIs for generation.
- `PR-007`: Google Workspace operations use `gws`; operator login command is `gws auth login -s drive,sheets,docs`.
- `PR-008`: Generated Sheets writes must be batched. Do not write each script cell one by one.

## Current Product Flow

1. An operator reads a client's configuration and isolated knowledge.
2. The operator selects eligible topics from the client-specific Google Sheet.
3. The operator creates and reviews content drafts with subscribed Codex/ChatGPT.
4. The operator batch-writes approved output through `gws`.
5. The local queue reflects only successful writes.

## Out Of Scope

- Automated OpenAI API generation.
- Storing Google OAuth tokens in the app DB.
- Hosted application and self-service client onboarding.
- Deployment-specific authentication implementation.
