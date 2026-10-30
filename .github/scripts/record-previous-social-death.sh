#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN GitHub secret is missing}"
: "${DASHBOARD_VERIFY_PASSWORD:?DASHBOARD_VERIFY_PASSWORD GitHub secret is missing}"

deployment_json="$(npx --prefix cloudflare-social-death wrangler deployments list --json --config cloudflare-social-death/wrangler.jsonc)"
version_id="$(node -e 'const d=JSON.parse(process.argv[1]); process.stdout.write(d[0]?.id ?? d[0]?.version_id ?? "")' "$deployment_json")"
printf 'version_id=%s\n' "$version_id" >> "$GITHUB_OUTPUT"

