#!/usr/bin/env bash
# qa-browser + verifier smoke — account gate + anti-scrape + commerce
set -euo pipefail
BASE="${1:-http://localhost:3000}"
UA="Mozilla/5.0 (compatible; KN-QA/1.0; +https://www.kamaunegasi.net)"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

pass=0
fail=0
check() {
  local name="$1"
  local code="$2"
  local expect="${3:-200}"
  if [[ "$code" == "$expect" ]]; then
    echo "PASS  $name ($code)"
    pass=$((pass + 1))
  else
    echo "FAIL  $name (got $code expected $expect)"
    fail=$((fail + 1))
  fi
}

echo "== squad QA smoke @ $BASE =="

# Unauthenticated home must redirect to access (not leak content to scrapers)
home_code="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/")"
check "home-redirect-access" "$home_code" "307"

check "access" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/access")"

# Content APIs require auth
check "feed-auth" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/api/feed")" "401"
check "ingest-auth" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/api/ingest")" "401"

# curl UA (bot signature) blocked on register
check "bot-register-denied" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/register" -H 'content-type: application/json' -d '{}')" "403"

check "robots" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/robots.txt")"
check "sitemap" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/sitemap.xml")"

# oEmbed must reject foreign hosts (still auth-gated → 401 without session)
check "oembed-auth" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/api/oembed?url=https://evil.example/x")" "401"

EMAIL="qa_$(date +%s)@example.com"
PASS='qa-test-pass-12345'

reg="$(curl -s -A "$UA" -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/register" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"displayName\":\"QA\",\"birthDate\":\"1990-06-15\",\"ageConfirmed\":true,\"website\":\"\"}")"
echo "$reg" | grep -q '"email"' && echo "PASS  register" && pass=$((pass+1)) || { echo "FAIL  register"; fail=$((fail+1)); }

check "home-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/")"
check "feed-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/feed")"
check "ingest-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/ingest")"

# download without purchase → 402
dl="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=qtoss-vol1")"
check "download-paywall" "$dl" "402"

# webhook must fail closed without secret
wh="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -X POST "$BASE/api/commerce/webhook" -H 'content-type: application/json' -d '{"type":"checkout.session.completed"}')"
check "webhook-fail-closed" "$wh" "503"

# purchase (demo mode) then download
buy="$(curl -s -A "$UA" -b "$JAR" -X POST "$BASE/api/commerce/purchase" \
  -H 'content-type: application/json' \
  -d '{"catalogId":"qtoss-vol1"}')"
echo "$buy" | grep -qE '"mode"|"alreadyOwned"' && echo "PASS  purchase-demo" && pass=$((pass+1)) || { echo "FAIL  purchase-demo"; fail=$((fail+1)); }

check "download-owned" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=qtoss-vol1")"

don="$(curl -s -A "$UA" -b "$JAR" -X POST "$BASE/api/donate" \
  -H 'content-type: application/json' \
  -d '{"cents":500}')"
echo "$don" | grep -q '"url"' && echo "PASS  donate-demo" && pass=$((pass+1)) || { echo "FAIL  donate-demo"; fail=$((fail+1)); }

robots="$(curl -s -A "$UA" "$BASE/robots.txt")"
echo "$robots" | grep -qi 'Disallow: /' && echo "PASS  robots-disallow-all" && pass=$((pass+1)) || { echo "FAIL  robots-disallow-all"; fail=$((fail+1)); }

home="$(curl -s -A "$UA" -b "$JAR" "$BASE/")"
echo "$home" | grep -qi '18+' && echo "PASS  compliance-18plus-marker" && pass=$((pass+1)) || { echo "FAIL  compliance-18plus-marker"; fail=$((fail+1)); }

ingest="$(curl -s -A "$UA" -b "$JAR" "$BASE/api/ingest")"
echo "$ingest" | grep -q '357Itsumi' && echo "PASS  ingest-exact-357Itsumi" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-357Itsumi"; fail=$((fail+1)); }
echo "$ingest" | grep -q 'Streetpolitik' && echo "PASS  ingest-exact-Streetpolitik" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-Streetpolitik"; fail=$((fail+1)); }

echo "== result: $pass passed · $fail failed =="
[[ "$fail" -eq 0 ]]
