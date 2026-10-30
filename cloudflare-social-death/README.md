# Social Death dashboard deployment

Production is deployed only by `.github/workflows/deploy-social-death.yml`.
The workflow verifies the immutable release and media manifest, renders it in
Chromium, deploys through a scoped Cloudflare API token, verifies authentication,
security headers and exact live bytes, and rolls back on a failed live check.

Required GitHub Actions repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare **Edit Cloudflare Workers** API token,
  restricted to account `ba945811a3c7319afcbdd7ff7c50cda8`.
- `DASHBOARD_VERIFY_PASSWORD` — the existing dashboard password, used only to
  verify the protected live response. It does not change the Worker secret.

No secret belongs in a source file, command argument, commit, issue, or chat.
After these secrets are saved once, local Wrangler OAuth is not part of the
deployment path.
