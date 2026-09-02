# Google Workspace Auth, Picker, and gws

## OAuth scopes

Use the narrowest scopes possible. For the current workflow, start with:

- Drive: select/read/move files and folders.
- Sheets: read schedules and batch write generated scripts.
- Docs: read source docs.

For `gws`, use:

```bash
gws auth login -s drive,sheets,docs
```

Use `docs`, not `doc`.

## gws login in the web product

`gws auth login` is interactive and opens a browser. The MVP should not run this inside the public request path.

Recommended MVP:

1. The web app shows the operator command.
2. The operator runs it in a controlled workstation or worker environment.
3. The operator completes the browser OAuth flow.
4. The worker uses `gws` for Drive/Sheets/Docs operations.

Future experiment:

- Spawn `gws auth login -s drive,sheets,docs` from a private worker.
- Capture stdout/stderr.
- Show the OAuth URL to the operator in the web app.
- Treat this as an operator-only flow, never an end-user self-service credential flow until security review is complete.

## Google Picker

Use Google Picker on the frontend to let users choose files they can access with their Google account.

Picker is for selecting files, not organizing Drive. Moving files still requires Drive API or `gws drive files update` with `addParents` and `removeParents`.

Store selected file IDs and folder IDs in DB. Do not store document contents in browser local storage.

## OAuth consent

For internal-only Google Workspace apps, configure OAuth consent as internal when possible.

For external/commercial use, expect Google verification if sensitive or restricted scopes are requested. Keep scopes minimal and document why each scope is needed.
