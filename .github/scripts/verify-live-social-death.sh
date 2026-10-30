#!/usr/bin/env bash
set -euo pipefail

: "${DASHBOARD_VERIFY_PASSWORD:?DASHBOARD_VERIFY_PASSWORD GitHub secret is missing}"

expected_hash="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync("Social_Death/dashboard/release.json", "utf8")).sha256)')"
anonymous_headers="$(mktemp)"
authorized_headers="$(mktemp)"
authorized_body="$(mktemp)"
trap 'rm -f "$anonymous_headers" "$authorized_headers" "$authorized_body"' EXIT

anonymous_status="$(curl --silent --show-error --location --output /dev/null --dump-header "$anonymous_headers" --write-out '%{http_code}' "$LIVE_URL/")"
test "$anonymous_status" = "401" || { echo "Expected anonymous HTTP 401, got $anonymous_status"; exit 1; }
grep -qi '^www-authenticate: Basic ' "$anonymous_headers"
grep -qi '^x-robots-tag: noindex, nofollow, noarchive' "$anonymous_headers"

authorized_status="$(curl --silent --show-error --location --user "${VERIFY_USERNAME}:${DASHBOARD_VERIFY_PASSWORD}" --output "$authorized_body" --dump-header "$authorized_headers" --write-out '%{http_code}' "$LIVE_URL/")"
test "$authorized_status" = "200" || { echo "Expected authorized HTTP 200, got $authorized_status"; exit 1; }
grep -qi '^cache-control: private, no-store' "$authorized_headers"
grep -qi '^x-frame-options: DENY' "$authorized_headers"

actual_hash="$(sha256sum "$authorized_body" | cut -d ' ' -f 1)"
test "$actual_hash" = "$expected_hash" || { echo "Live SHA-256 does not match the release"; exit 1; }
echo "Live protected release verified: $actual_hash"

