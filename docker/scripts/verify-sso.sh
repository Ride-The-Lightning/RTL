#!/usr/bin/env bash
#
# Check the BTCPay SSO harness end to end.
#
# Walks the exact path a browser takes when an operator clicks the RTL link on
# BTCPay Server's Services page, and asserts each step. Run it after any change
# to authentication, CSRF or static serving -- this is the entry path BTCPay
# uses, and none of it is covered by logging into the standalone fixture RTL.
#
#   docker compose --profile sso up -d
#   ./scripts/verify-sso.sh
#
# Usage:  ./scripts/verify-sso.sh    (from the docker/ directory)
#
# Exits non-zero if any check fails, so it can gate a PR.

# Deliberately no -e: a failing assertion must record itself and let the rest of
# the checks run, rather than aborting on the first one. That means anything
# that would normally rely on -e needs its own guard.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BASE="http://localhost:${RTL_SSO_PORT:-3001}"
JAR="$(mktemp)"
JAR2="$(mktemp)"
trap 'rm -f "$JAR" "$JAR2"' EXIT

pass=0
fail=0
# Both return 0 explicitly: the checks below are written as `test && ok || bad`,
# which would also run `bad` if `ok` itself ever returned non-zero.
ok()  { echo "  PASS: $1"; pass=$((pass + 1)); return 0; }
bad() { echo "  FAIL: $1"; fail=$((fail + 1)); return 0; }

if ! docker compose --profile sso ps --status running --services 2>/dev/null | grep -qx rtl-sso; then
  echo "rtl-sso is not running. Start it with: docker compose --profile sso up -d" >&2
  exit 1
fi

cookie="$(docker compose --profile sso exec -T rtl-sso cat /RTL/cookie/.cookie | tr -d '\r\n')"
echo "cookie: ${cookie:0:16}... (${#cookie} chars)"

echo
echo "1. the proxy routes only /rtl, mirroring BTCPay's traefik rule"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")
[ "$code" = "404" ] && ok "GET / -> 404" || bad "GET / -> $code (want 404)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/authenticate")
[ "$code" = "404" ] && ok "GET /api/authenticate -> 404" || bad "GET /api/authenticate -> $code (want 404)"
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/rtl/")
[ "$code" = "200" ] && ok "GET /rtl/ -> 200" || bad "GET /rtl/ -> $code (want 200)"

echo
echo "2. the entry URL falls through to the catch-all, which mints the CSRF token"
body=$(curl -s -c "$JAR" "$BASE/rtl/api/authenticate/cookie?access-key=$cookie")
echo "$body" | grep -q '<base href="/rtl/">' \
  && ok "entry URL serves the SPA shell with base href /rtl/" \
  || bad "entry URL did not serve index.html"
xsrf=$(awk '/XSRF-TOKEN/ {print $7}' "$JAR")
[ -n "$xsrf" ] && ok "XSRF-TOKEN cookie minted" || bad "no XSRF-TOKEN cookie"
grep -q '_csrf' "$JAR" && ok "_csrf cookie set" || bad "no _csrf cookie"

echo
echo "3. the SPA posts sha256(access-key) as a password login"
hash=$(printf '%s' "$cookie" | shasum -a 256 | cut -d' ' -f1)
resp=$(curl -s -b "$JAR" -c "$JAR" -X POST "$BASE/rtl/api/authenticate" \
  -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $xsrf" \
  -d "{\"authenticateWith\":\"PASSWORD\",\"authenticationValue\":\"$hash\"}")
token=$(echo "$resp" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("token",""))' 2>/dev/null)
[ -n "$token" ] && ok "authenticated, JWT issued" || bad "auth failed: $resp"

echo
echo "4. the JWT reaches the node behind it"
info=$(curl -s -b "$JAR" "$BASE/rtl/api/lnd/getinfo" -H "Authorization: Bearer $token")
node_alias=$(echo "$info" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("alias",""))' 2>/dev/null)
[ "$node_alias" = "alice" ] && ok "GET /rtl/api/lnd/getinfo -> alias '$node_alias'" || bad "getinfo returned: ${info:0:200}"

echo
echo "5. the cookie rotates on login, so each BTCPay page render hands out a fresh one"
after=$(docker compose --profile sso exec -T rtl-sso cat /RTL/cookie/.cookie | tr -d '\r\n')
[ "$after" != "$cookie" ] && ok "cookie rotated after authentication" || bad "cookie did NOT rotate"

echo
echo "6. a wrong access-key is refused"
# The token has to come from the catch-all: GET /rtl/ is served by express.static,
# which mints no XSRF-TOKEN, and the POST would then fail CSRF (403) before it
# ever reached the access-key comparison this step is checking.
curl -s -c "$JAR2" "$BASE/rtl/api/authenticate/cookie?access-key=x" > /dev/null
x2=$(awk '/XSRF-TOKEN/ {print $7}' "$JAR2")
badhash=$(printf '%s' "not-the-cookie-value-but-long-enough-to-pass-the-length-check" | shasum -a 256 | cut -d' ' -f1)
code=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR2" -X POST "$BASE/rtl/api/authenticate" \
  -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $x2" \
  -d "{\"authenticateWith\":\"PASSWORD\",\"authenticationValue\":\"$badhash\"}")
[ "$code" = "406" ] && ok "wrong access-key -> 406" || bad "wrong access-key -> $code (want 406)"

echo
echo "7. the standalone fixture RTL is unaffected"
code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${RTL_PORT:-3000}/rtl/")
[ "$code" = "200" ] && ok "standalone RTL still serving on ${RTL_PORT:-3000}" || bad "standalone RTL -> $code"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
