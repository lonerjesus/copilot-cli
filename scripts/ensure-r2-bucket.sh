#!/usr/bin/env bash
# Optional: create house-media R2 bucket when Wrangler is authenticated.
# Never fails the build — Workers Builds tokens often lack R2 Edit.
# Media falls back to AUTH_KV when MEDIA_R2 is not bound.
set -uo pipefail

BUCKET="${R2_MEDIA_BUCKET:-kamaunegasi-media}"

echo "ensure-r2: attempting bucket '${BUCKET}' (optional)…"
if out="$(npx wrangler r2 bucket create "$BUCKET" 2>&1)"; then
  echo "$out"
  echo "ensure-r2: created '${BUCKET}'"
  exit 0
fi

if echo "$out" | grep -qiE 'already exists|code: 10004|409|A bucket with that name already exists'; then
  echo "ensure-r2: '${BUCKET}' already exists"
  exit 0
fi

echo "$out" | tail -20 >&2 || true
echo "ensure-r2: skip/warn — media uses AUTH_KV until MEDIA_R2 is bound"
exit 0
