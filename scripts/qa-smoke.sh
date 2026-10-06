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
check "footprint-redirect" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/footprint")" "307"
check "footprint-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/footprint")"
check "feed-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/feed")"
check "ingest-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/ingest")"
check "catalog-authed" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/catalog")"
check "catalog-auth" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/api/catalog")" "401"

# download uploaded (paywalled) without purchase → 402
dl="$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=qtoss-vol1")"
check "download-paywall" "$dl" "402"

# fetched/scraped media downloads free for members
check "download-fetched-free" "$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -b "$JAR" "$BASE/api/commerce/download?id=bandcamp-30over9-good-sloppy")" "200"

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
echo "$home" | grep -q '/footprint' && echo "PASS  home-watch-footprint-link" && pass=$((pass+1)) || { echo "FAIL  home-watch-footprint-link"; fail=$((fail+1)); }
echo "$home" | grep -q 'drive__face\|id="stream"' && echo "PASS  home-drive-rack" && pass=$((pass+1)) || { echo "FAIL  home-drive-rack"; fail=$((fail+1)); }
echo "$home" | grep -q 'id="browse"' && echo "PASS  home-browse-bay" && pass=$((pass+1)) || { echo "FAIL  home-browse-bay"; fail=$((fail+1)); }
echo "$home" | grep -q 'data-age-gate' && echo "PASS  age-gate-flag" && pass=$((pass+1)) || { echo "FAIL  age-gate-flag"; fail=$((fail+1)); }
echo "$home" | grep -q 'portfolio · vlog · stream' && echo "PASS  home-tagline" && pass=$((pass+1)) || { echo "FAIL  home-tagline"; fail=$((fail+1)); }
echo "$home" | grep -q '/privacy' && echo "PASS  home-privacy-link" && pass=$((pass+1)) || { echo "FAIL  home-privacy-link"; fail=$((fail+1)); }
echo "$home" | grep -qE 'f4\.bcbits\.com/img/|substackcdn\.com/image/|mzstatic\.com/image/' \
  && echo "PASS  home-media-posters" && pass=$((pass+1)) \
  || { echo "FAIL  home-media-posters"; fail=$((fail+1)); }

fp="$(curl -s -A "$UA" -b "$JAR" "$BASE/footprint")"
echo "$fp" | grep -qi 'FOOTPRINT' && echo "PASS  footprint-page-title" && pass=$((pass+1)) || { echo "FAIL  footprint-page-title"; fail=$((fail+1)); }
echo "$fp" | grep -q 'floppy' && echo "PASS  footprint-floppy-cards" && pass=$((pass+1)) || { echo "FAIL  footprint-floppy-cards"; fail=$((fail+1)); }
echo "$fp" | grep -q 'floppy__menu\|footprint__menu' && echo "PASS  footprint-filter-menu" && pass=$((pass+1)) || { echo "FAIL  footprint-filter-menu"; fail=$((fail+1)); }
echo "$fp" | grep -q '/#browse' && echo "PASS  footprint-browse-deeplink" && pass=$((pass+1)) || { echo "FAIL  footprint-browse-deeplink"; fail=$((fail+1)); }

# Admin station — non-admin forbidden; admin can publish
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
    -d '{"title":"QA Admin Vlog","brand":"TSOL","kind":"vlog","category":"vlog","subcategory":"season","platform":"house","externalUrl":"https://www.kamaunegasi.net/","blurb":"Admin station publish smoke.","paywalled":true}')"
  echo "$pub" | grep -q '"id"' && echo "PASS  admin-publish" && pass=$((pass+1)) || { echo "FAIL  admin-publish"; fail=$((fail+1)); }
  rm -f "$AJAR"
else
  echo "SKIP  admin-publish (ADMIN_EMAIL unset)"
fi

ingest="$(curl -s -A "$UA" -b "$JAR" "$BASE/api/ingest")"
echo "$ingest" | grep -q '357Itsumi' && echo "PASS  ingest-exact-357Itsumi" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-357Itsumi"; fail=$((fail+1)); }
echo "$ingest" | grep -q 'Streetpolitik' && echo "PASS  ingest-exact-Streetpolitik" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-Streetpolitik"; fail=$((fail+1)); }

echo "== result: $pass passed · $fail failed =="
[[ "$fail" -eq 0 ]]
