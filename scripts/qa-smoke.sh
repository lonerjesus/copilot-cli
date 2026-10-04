#!/usr/bin/env bash
# qa-browser + verifier smoke — zero third-party content assumptions
set -euo pipefail
BASE="${1:-http://localhost:3000}"

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
check "home" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")"
check "feed" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/feed")"
check "ingest" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/ingest")"
check "robots" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/robots.txt")"
check "sitemap" "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/sitemap.xml")"

# oEmbed must reject foreign hosts
bad="$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/oembed?url=https://evil.example/x")"
check "oembed-deny-foreign" "$bad" "400"

# ingest must report ok + house platforms
ingest="$(curl -s "$BASE/api/ingest")"
echo "$ingest" | grep -q '"agent":"content-ingest"' && echo "PASS  ingest-agent-field" && pass=$((pass+1)) || { echo "FAIL  ingest-agent-field"; fail=$((fail+1)); }
echo "$ingest" | grep -q '357Itsumi' && echo "PASS  ingest-exact-357Itsumi" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-357Itsumi"; fail=$((fail+1)); }
echo "$ingest" | grep -q 'Streetpolitik' && echo "PASS  ingest-exact-Streetpolitik" && pass=$((pass+1)) || { echo "FAIL  ingest-exact-Streetpolitik"; fail=$((fail+1)); }

# home must carry 18+ notice
home="$(curl -s "$BASE/")"
echo "$home" | grep -qi '18+' && echo "PASS  compliance-18plus-marker" && pass=$((pass+1)) || { echo "FAIL  compliance-18plus-marker"; fail=$((fail+1)); }

echo "== result: $pass passed · $fail failed =="
[[ "$fail" -eq 0 ]]
