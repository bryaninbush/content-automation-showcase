# Cloud Run Deployment Plan

## Why Cloud Run

The selected production auth model is Cloud Run + Identity-Aware Proxy. IAP gives a Google-managed access gate before the app receives traffic.

Zeabur remains a useful deployment research path, but it cannot provide Google Cloud IAP in front of the app.

## Runtime

The app listens on `PORT`, which Cloud Run provides.

Build with the root `Dockerfile`.

## Required Google Cloud services

- Cloud Run
- Identity-Aware Proxy
- Cloud SQL or another managed Postgres-compatible database for production
- Secret Manager
- Cloud KMS if encrypting application-level token fields
- OAuth consent / Google Auth platform

## Secrets

Do not put credentials in repo or normal environment variables.

Use Secret Manager for:

- OAuth client secret if needed by backend.
- Database password.
- Encryption key material references.
- Any service integration tokens.

Non-secret config can be env vars, such as:

- `PORT`
- `DATABASE_POOL_MAX`
- bootstrap owner email for initial setup

## IAP setup checklist

1. Deploy Cloud Run service.
2. Put it behind HTTPS Load Balancer if required by the chosen IAP setup.
3. Enable IAP.
4. Grant access to Google Groups rather than individual users when possible.
5. Confirm requests include IAP headers.
6. Seed the first owner membership in DB.

## Production database

Preferred lightweight path: Neon PostgreSQL or another managed Postgres-compatible database exposed through `DATABASE_URL`.

Google Cloud-native path: Cloud SQL for PostgreSQL.

The app expects `DATABASE_URL` from Secret Manager in every non-test deployed environment.
