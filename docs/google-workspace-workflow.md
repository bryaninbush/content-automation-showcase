# Google Workspace Workflow Boundary

Google Workspace is an operator-controlled collaboration surface. The intended command boundary is:

```bash
gws auth login -s drive,sheets,docs
```

For each client, `client-config.md` defines the worksheet name, column mapping, allowed content types, and placeholders for the associated Workspace resources. Real Spreadsheet IDs, Drive folder IDs, URLs, credentials, and authenticated sessions are never committed.

## Read and write rules

1. Read the content schedule from the client-specific Google Sheet.
2. Skip rows without a tag or topic, and never overwrite completed script cells.
3. Generate all missing versions for a topic before beginning another topic.
4. Collect new scripts and optional image-production briefs.
5. Use one `gws sheets spreadsheets values batchUpdate` call for the collected changes.
6. Update the local queue only after that batch write succeeds.

When `gws` is unavailable, the workflow can use the local queue as a clearly marked fallback; it must not claim that external state was updated.
