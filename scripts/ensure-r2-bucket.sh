#!/usr/bin/env bash
# Ensure the house-media R2 bucket exists before wrangler deploy.
# Workers Builds authenticates Wrangler automatically; local runs no-op without token.
set -euo pipefail

BUCKET="${R2_MEDIA_BUCKET:-kamaunegasi-media}"

has_auth=0
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" || -n "${CLOUDFLARE_API_KEY:-}" ]]; then
  has_auth=1
else
  whoami_out="$(npx wrangler whoami 2>&1 || true)"
  if echo "$whoami_out" | grep -qiE 'Account Name|email:|User ID'; then
    if ! echo "$whoami_out" | grep -qiE 'not authenticated|not logged in'; then
      has_auth=1
    fi
  fi
fi

if [[ "$has_auth" -ne 1 ]]; then
  echo "ensure-r2: skip (no Cloudflare auth in this environment)"
  exit 0
fi

echo "ensure-r2: ensuring bucket '${BUCKET}' exists…"
# create exits non-zero if the bucket already exists — treat that as success.
if out="$(npx wrangler r2 bucket create "$BUCKET" 2>&1)"; then
  echo "$out"
  echo "ensure-r2: created '${BUCKET}'"
else
  if echo "$out" | grep -qiE 'already exists|code: 10004|409|A bucket with that name already exists'; then
    echo "ensure-r2: '${BUCKET}' already exists"
  else
    echo "$out" >&2
    echo "ensure-r2: create failed" >&2
    exit 1
  fi
fi
