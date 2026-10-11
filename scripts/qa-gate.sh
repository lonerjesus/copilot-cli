#!/usr/bin/env bash
# Elite unified gate — units → API e2e → browser blob (optional).
# Usage: BASE=http://127.0.0.1:3040 ADMIN_EMAIL=… ADMIN_PASS=… bash scripts/qa-gate.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${BASE:-http://127.0.0.1:3000}"
BASE="${BASE%/}"
export BASE
export ADMIN_EMAIL="${ADMIN_EMAIL:-av.owner@kamaunegasi.net}"
export ADMIN_PASS="${ADMIN_PASS:-qa-test-pass-12345}"

echo "== qa:gate @ $BASE (admin=$ADMIN_EMAIL) =="

fail=0
run() {
  local name="$1"
  shift
  echo ""
  echo "—— $name ——"
  if "$@"; then
    echo "OK    $name"
  else
    echo "FAIL  $name"
    fail=$((fail + 1))
  fi
  # Brief pause so auth rate buckets can drain between suites
  sleep 1
}

run "qa:player-queue" npm run qa:player-queue
run "qa:playable-house" npm run qa:playable-house
run "qa:av" npm run qa:av
run "qa:media-ref" npm run qa:media-ref
run "qa:media-meta" npm run qa:media-meta
run "qa:smoke" bash scripts/qa-smoke.sh "$BASE"
run "qa:media-range" npm run qa:media-range
run "qa:av-e2e" npm run qa:av-e2e
run "qa:edit-save" npm run qa:edit-save
run "qa:writing-open" npm run qa:writing-open
run "qa:guest" npm run qa:guest

# Browser blob — skip cleanly when Playwright/Chrome unavailable
if node -e "import('playwright').then(()=>process.exit(0)).catch(()=>process.exit(2))" 2>/dev/null; then
  if [[ -x "${CHROME_PATH:-/usr/bin/google-chrome-stable}" ]] || command -v google-chrome-stable >/dev/null 2>&1; then
    run "qa:player-blob" npm run qa:player-blob
  else
    echo "SKIP  qa:player-blob (no chrome)"
  fi
else
  echo "SKIP  qa:player-blob (no playwright)"
fi

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "== qa:gate GREEN =="
  exit 0
fi
echo "== qa:gate RED ($fail suites) =="
exit 1
