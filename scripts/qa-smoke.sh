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
check "privacy" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/privacy")"
check "terms" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/terms")"
check "og-image" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/og.png")"

access_html="$(curl -s -A "$UA" "$BASE/access")"
echo "$access_html" | grep -q 'portfolio · vlog · stream' && echo "PASS  access-tagline" && pass=$((pass+1)) || { echo "FAIL  access-tagline"; fail=$((fail+1)); }
echo "$access_html" | grep -qi 'forgot password' && echo "PASS  access-forgot-stub" && pass=$((pass+1)) || { echo "FAIL  access-forgot-stub"; fail=$((fail+1)); }
echo "$access_html" | grep -q '/privacy' && echo "PASS  access-privacy-link" && pass=$((pass+1)) || { echo "FAIL  access-privacy-link"; fail=$((fail+1)); }
echo "$access_html" | grep -q '/terms' && echo "PASS  access-terms-link" && pass=$((pass+1)) || { echo "FAIL  access-terms-link"; fail=$((fail+1)); }
echo "$access_html" | grep -qiE 'magcloud|quarantined|fetched platform' \
  && { echo "FAIL  access-no-magcloud-fetched"; fail=$((fail+1)); } \
  || { echo "PASS  access-no-magcloud-fetched"; pass=$((pass+1)); }

# forgot-password stub — generic 200, no account probe; bots denied
forgot_code="$(curl -s -o /tmp/kn-forgot.json -w '%{http_code}' -A "$UA" -X POST "$BASE/api/auth/forgot-password" \
  -H 'content-type: application/json' \
  -d '{"email":"nobody@example.com","website":""}')"
if [[ "$forgot_code" == "200" ]] && grep -qE '"ok"[[:space:]]*:[[:space:]]*true' /tmp/kn-forgot.json; then
  echo "PASS  forgot-password-stub ($forgot_code)"
  pass=$((pass + 1))
else
  echo "FAIL  forgot-password-stub (code=$forgot_code body=$(head -c 200 /tmp/kn-forgot.json))"
  fail=$((fail + 1))
fi
rm -f /tmp/kn-forgot.json
check "bot-forgot-denied" "$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/forgot-password" -H 'content-type: application/json' -d '{"email":"x@y.com"}')" "403"

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
check "footprint-gone" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/footprint")" "307"
check "feed-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/feed")"
check "ingest-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/ingest")"
check "catalog-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/catalog")"
check "catalog-auth" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/api/catalog")" "401"

catalog="$(curl -s -A "$UA" -b "$JAR" "$BASE/api/catalog")"
echo "$catalog" | grep -qE '"items"' \
  && echo "PASS  catalog-shape" && pass=$((pass+1)) \
  || { echo "FAIL  catalog-shape"; fail=$((fail+1)); }
echo "$catalog" | grep -qiE 'magcloud|qtoss|quarantined' \
  && { echo "FAIL  catalog-no-magcloud"; fail=$((fail+1)); } \
  || { echo "PASS  catalog-no-magcloud"; pass=$((pass+1)); }

# Seed MagCloud rows removed — unknown id → 404
check "download-seed-gone" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=qtoss-vol1")" "404"

# fetched outside catalog removed
check "download-fetched-gone" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=bandcamp-30over9-good-sloppy")" "404"

# webhook must fail closed without secret
wh="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -X POST "$BASE/api/commerce/webhook" -H 'content-type: application/json' -d '{"type":"checkout.session.completed"}')"
check "webhook-fail-closed" "$wh" "503"

don="$(curl -s -A "$UA" -b "$JAR" -X POST "$BASE/api/donate" \
  -H 'content-type: application/json' \
  -d '{"cents":500}')"
echo "$don" | grep -q '"url"' && echo "PASS  donate-demo" && pass=$((pass+1)) || { echo "FAIL  donate-demo"; fail=$((fail+1)); }

robots="$(curl -s -A "$UA" "$BASE/robots.txt")"
echo "$robots" | grep -qi 'Disallow: /' && echo "PASS  robots-disallow-all" && pass=$((pass+1)) || { echo "FAIL  robots-disallow-all"; fail=$((fail+1)); }

home="$(curl -s -A "$UA" -b "$JAR" "$BASE/")"
echo "$home" | grep -qi '18+' && echo "PASS  compliance-18plus-marker" && pass=$((pass+1)) || { echo "FAIL  compliance-18plus-marker"; fail=$((fail+1)); }
echo "$home" | grep -q 'shell__rail-layout\|rail__nav\|shell--rail' && echo "PASS  home-rail-menu" && pass=$((pass+1)) || { echo "FAIL  home-rail-menu"; fail=$((fail+1)); }
echo "$home" | grep -q 'stream' && echo "PASS  home-stream-nav" && pass=$((pass+1)) || { echo "FAIL  home-stream-nav"; fail=$((fail+1)); }
echo "$home" | grep -q 'browse' && echo "PASS  home-browse-nav" && pass=$((pass+1)) || { echo "FAIL  home-browse-nav"; fail=$((fail+1)); }
echo "$home" | grep -q 'data-age-gate' && echo "PASS  age-gate-flag" && pass=$((pass+1)) || { echo "FAIL  age-gate-flag"; fail=$((fail+1)); }
echo "$home" | grep -q '/privacy' && echo "PASS  home-privacy-link" && pass=$((pass+1)) || { echo "FAIL  home-privacy-link"; fail=$((fail+1)); }
echo "$home" | grep -qiE 'magcloud|quarantined|qtoss|footprint' \
  && { echo "FAIL  home-no-magcloud-footprint"; fail=$((fail+1)); } \
  || { echo "PASS  home-no-magcloud-footprint"; pass=$((pass+1)); }
echo "$home" | grep -q 'stream__empty\|Empty' \
  && echo "PASS  home-empty-stream" && pass=$((pass+1)) \
  || { echo "FAIL  home-empty-stream"; fail=$((fail+1)); }
echo "$home" | grep -q 'id="names"\|cosmo-hero\|cosmogram' && { echo "FAIL  home-no-names-chart"; fail=$((fail+1)); } || { echo "PASS  home-no-names-chart"; pass=$((pass+1)); }

# Footprint archive removed
check "footprint-anon" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/footprint")" "307"

# One login at a time — second login invalidates the first session
JAR2="$(mktemp)"
curl -s -A "$UA" -c "$JAR2" -b "$JAR2" -X POST "$BASE/api/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"website\":\"\"}" >/dev/null
check "session-exclusive-old" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/auth/me")" "401"
check "session-exclusive-new" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR2" "$BASE/api/auth/me")"
# Keep using the active jar for remaining checks
rm -f "$JAR"
JAR="$JAR2"

# Admin station — non-admin forbidden; admin can publish + commerce path
check "admin-page-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/admin")"
check "admin-api-forbidden" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/admin/content")" "403"

if [[ -n "${ADMIN_EMAIL:-}" ]]; then
  AJAR="$(mktemp)"
  areg="$(curl -s -A "$UA" -c "$AJAR" -b "$AJAR" -X POST "$BASE/api/auth/register" \
    -H 'content-type: application/json' \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS\",\"displayName\":\"Owner\",\"birthDate\":\"1987-04-05\",\"ageConfirmed\":true,\"website\":\"\"}")"
  # login if already exists
  if ! echo "$areg" | grep -q '"email"'; then
    curl -s -A "$UA" -c "$AJAR" -b "$AJAR" -X POST "$BASE/api/auth/login" \
      -H 'content-type: application/json' \
      -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$PASS\",\"website\":\"\"}" >/dev/null
  fi
  check "admin-api-ok" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$AJAR" "$BASE/api/admin/content")"
  pub="$(curl -s -A "$UA" -b "$AJAR" -X POST "$BASE/api/admin/content" \
    -H 'content-type: application/json' \
    -d '{"title":"QA Admin Vlog","subtitle":"smoke","kind":"vlog","category":"vlog","subcategory":"season","platform":"house","externalUrl":"https://www.kamaunegasi.net/","tags":["qa","smoke"],"paywalled":true}')"
  echo "$pub" | grep -q '"id"' && echo "PASS  admin-publish" && pass=$((pass+1)) || { echo "FAIL  admin-publish"; fail=$((fail+1)); }
  CID="$(printf '%s' "$pub" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  if [[ -n "$CID" ]]; then
    check "download-paywall" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=$CID")" "402"
    buy="$(curl -s -A "$UA" -b "$JAR" -X POST "$BASE/api/commerce/purchase" \
      -H 'content-type: application/json' \
      -d "{\"catalogId\":\"$CID\"}")"
    echo "$buy" | grep -qE '"mode"|"alreadyOwned"' && echo "PASS  purchase-demo" && pass=$((pass+1)) || { echo "FAIL  purchase-demo"; fail=$((fail+1)); }
    check "download-owned" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=$CID")"
  else
    echo "FAIL  purchase-demo (no catalog id)"; fail=$((fail+1))
    echo "FAIL  download-owned (no catalog id)"; fail=$((fail+1))
  fi
  rm -f "$AJAR"
else
  echo "SKIP  admin-publish (ADMIN_EMAIL unset)"
  echo "SKIP  purchase-demo (ADMIN_EMAIL unset)"
  echo "SKIP  download-owned (ADMIN_EMAIL unset)"
fi

ingest="$(curl -s -A "$UA" -b "$JAR" "$BASE/api/ingest")"
echo "$ingest" | grep -q '357Itsumi' && echo "PASS  ingest-exact-357Itsumi" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-357Itsumi"; fail=$((fail+1)); }
echo "$ingest" | grep -q 'Streetpolitik' && echo "PASS  ingest-exact-Streetpolitik" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-Streetpolitik"; fail=$((fail+1)); }
echo "$ingest" | grep -qi 'magcloud' \
  && { echo "FAIL  ingest-no-magcloud"; fail=$((fail+1)); } \
  || { echo "PASS  ingest-no-magcloud"; pass=$((pass+1)); }

echo "== result: $pass passed · $fail failed =="
[[ "$fail" -eq 0 ]]
