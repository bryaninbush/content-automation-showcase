# IAP Setup Checklist

1. Deploy the Cloud Run service with `DATABASE_URL` mounted from Secret Manager.
2. Put the service behind the HTTPS load balancer path required for IAP.
3. Enable IAP for the backend service.
4. Grant access to a Google Group, not individual accounts.
5. Confirm requests include `x-goog-authenticated-user-email` and `x-goog-authenticated-user-id`.
6. Run `bun run db:init` once with the production owner email.
7. Verify `/api/me` returns the expected owner membership.
