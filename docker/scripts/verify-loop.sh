#!/usr/bin/env bash
#
# Check the Loop harness end to end, through RTL.
#
# Logs into the harness's RTL, calls every Loop route RTL exposes, then runs a
# Loop Out and a Loop In to completion against the regtest Loop server, mining
# the blocks each swap needs. Run it after any change to the Loop controller,
# its routes, or the swap server options.
#
#   docker compose --profile loop up -d
#   ./scripts/seed.sh                # once, on a fresh network
#   ./scripts/verify-loop.sh
#
# Usage:  ./scripts/verify-loop.sh    (from the docker/ directory)
#
# Each run performs two real swaps of SWAP_SATS, so it moves alice's balances:
# the fixture is no longer in its freshly seeded state afterwards.
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

BITCOIN_RPC_USER="${BITCOIN_RPC_USER:-rtldev}"
BITCOIN_RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-rtldev}"

BASE="http://localhost:${RTL_LOOP_PORT:-3002}/rtl"
API="$BASE/api"
# multiPass in rtl/RTL-Config.loop.json
PASSWORD="rtldev"
SWAP_SATS=500000
# A swap needs two or three blocks; each attempt mines one and waits 3s.
SWAP_ATTEMPTS=40
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

pass=0
fail=0
# Both return 0 explicitly: the checks below are written as `test && ok || bad`,
# which would also run `bad` if `ok` itself ever returned non-zero.
ok()  { echo "  PASS: $1"; pass=$((pass + 1)); return 0; }
bad() { echo "  FAIL: $1"; fail=$((fail + 1)); return 0; }

for svc in loopserver loopd rtl-loop; do
  if ! docker compose --profile loop ps --status running --services 2>/dev/null | grep -qx "$svc"; then
    echo "$svc is not running. Start it with: docker compose --profile loop up -d" >&2
    exit 1
  fi
done

bcli() {
  docker compose exec -T bitcoind bitcoin-cli -regtest \
    -rpcuser="$BITCOIN_RPC_USER" -rpcpassword="$BITCOIN_RPC_PASSWORD" "$@"
}

# Read one value out of a JSON document on stdin: `jget a.b.0.c`. Prints nothing
# when the input is not JSON or the path is missing. This matters here more than
# usual: a wrong API path does not 404, it falls through to RTL's catch-all and
# returns index.html with a 200, so only the body tells a real answer apart.
jget() {
  python3 -c '
import sys, json
try:
    v = json.load(sys.stdin)
    for k in sys.argv[1].split("."):
        v = v[int(k)] if isinstance(v, list) else v[k]
    print(v if not isinstance(v, bool) else str(v).lower())
except Exception:
    pass
' "$1"
}

api_get() {
  curl -s --max-time 60 -b "$JAR" -H "Authorization: Bearer $token" "$API$1"
}

api_post() {
  curl -s --max-time 120 -b "$JAR" -X POST "$API$1" \
    -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $xsrf" \
    -H "Authorization: Bearer $token" -d "$2"
}

mine() {
  bcli -rpcwallet=rtldev generatetoaddress "$1" "$MINE_ADDR" >/dev/null
}

# Mine a block at a time until RTL reports the swap in a final state. $1 is the
# swap id as RTL's swaps view sends it: the swap hash in URL-safe base64.
wait_for_swap() {
  local id=$1 state="" i=1
  while [ "$i" -le "$SWAP_ATTEMPTS" ]; do
    state=$(api_get "/loop/swap/$id" | jget state)
    case "$state" in
      SUCCESS|FAILED) break ;;
    esac
    mine 1
    sleep 3
    i=$((i + 1))
  done
  echo "${state:-no state returned}"
}

# The swap id as the REST route wants it: URL-safe base64 of the 32-byte hash.
urlsafe() { tr '+/' '-_'; }

echo "0. the network is ready to swap"
# Volumes survive a restart but the mining wallet is not reloaded with them.
bcli loadwallet rtldev >/dev/null 2>&1
MINE_ADDR=$(bcli -rpcwallet=rtldev getnewaddress 2>/dev/null)
if [ -z "$MINE_ADDR" ]; then
  echo "No rtldev mining wallet. Seed the network first: ./scripts/seed.sh" >&2
  exit 1
fi
# LND calls itself out of sync once the chain tip is a few hours old, and loopd
# will not start its swap client until lnd is synced. A fresh block clears it.
mine 1

token=""
xsrf=""
curl -s -c "$JAR" "$BASE/home" > /dev/null
xsrf=$(awk '/XSRF-TOKEN/ {print $7}' "$JAR")
hash=$(printf '%s' "$PASSWORD" | shasum -a 256 | cut -d' ' -f1)
resp=$(curl -s -b "$JAR" -c "$JAR" -X POST "$API/authenticate" \
  -H 'Content-Type: application/json' -H "X-XSRF-TOKEN: $xsrf" \
  -d "{\"authenticateWith\":\"PASSWORD\",\"authenticationValue\":\"$hash\"}")
token=$(echo "$resp" | jget token)
[ -n "$token" ] && ok "logged into the harness RTL" || bad "login failed: ${resp:0:200}"

# getinfo also initialises the session's node options; without it later calls 401.
node_alias=$(api_get /lnd/getinfo | jget alias)
[ "$node_alias" = "alice" ] && ok "RTL is on alice" || bad "getinfo alias: '${node_alias}' (want alice)"

# loopd answers only once lnd is synced and it has reached the Loop server.
network=""
for _ in $(seq 1 60); do
  network=$(api_get /loop/info | jget network)
  [ -n "$network" ] && break
  sleep 2
done

echo
echo "1. loopd is reachable through RTL"
info=$(api_get /loop/info)
[ "$network" = "regtest" ] && ok "GET /loop/info -> network regtest, loopd $(echo "$info" | jget version)" \
  || bad "GET /loop/info: ${info:0:200}"

echo
echo "2. terms"
for dir in out in; do
  terms=$(api_get "/loop/$dir/terms")
  min=$(echo "$terms" | jget min_swap_amount)
  max=$(echo "$terms" | jget max_swap_amount)
  if [ -n "$min" ] && [ -n "$max" ] && [ "$min" -le "$SWAP_SATS" ] && [ "$max" -ge "$SWAP_SATS" ]; then
    ok "GET /loop/$dir/terms -> $min..$max sats"
  else
    bad "GET /loop/$dir/terms: ${terms:0:200}"
  fi
done

echo
echo "3. quotes"
# swapPublicationDeadline=0 is what the UI sends when "Fast" is ticked: the server
# publishes the Loop Out HTLC straight away instead of holding it for a batch.
out_quote=$(api_get "/loop/out/quote/$SWAP_SATS?targetConf=2&swapPublicationDeadline=0")
out_swap_fee=$(echo "$out_quote" | jget swap_fee_sat)
out_sweep_fee=$(echo "$out_quote" | jget htlc_sweep_fee_sat)
out_prepay=$(echo "$out_quote" | jget prepay_amt_sat)
[ -n "$out_swap_fee" ] && [ -n "$out_sweep_fee" ] && [ -n "$out_prepay" ] \
  && ok "GET /loop/out/quote/$SWAP_SATS -> swap fee $out_swap_fee, sweep fee $out_sweep_fee, prepay $out_prepay" \
  || bad "GET /loop/out/quote/$SWAP_SATS: ${out_quote:0:200}"
[ "$(echo "$out_quote" | jget amount)" = "$SWAP_SATS" ] && ok "the quote carries the amount it was asked for" \
  || bad "out quote amount: '$(echo "$out_quote" | jget amount)' (want $SWAP_SATS)"

in_quote=$(api_get "/loop/in/quote/$SWAP_SATS?targetConf=2&swapPublicationDeadline=0")
in_swap_fee=$(echo "$in_quote" | jget swap_fee_sat)
in_publish_fee=$(echo "$in_quote" | jget htlc_publish_fee_sat)
[ -n "$in_swap_fee" ] && [ -n "$in_publish_fee" ] \
  && ok "GET /loop/in/quote/$SWAP_SATS -> swap fee $in_swap_fee, publish fee $in_publish_fee" \
  || bad "GET /loop/in/quote/$SWAP_SATS: ${in_quote:0:200}"

for dir in out in; do
  tq=$(api_get "/loop/$dir/termsAndQuotes?targetConf=2")
  lo=$(echo "$tq" | jget 0.amount)
  hi=$(echo "$tq" | jget 1.amount)
  [ -n "$lo" ] && [ -n "$hi" ] && [ "$lo" -lt "$hi" ] \
    && ok "GET /loop/$dir/termsAndQuotes -> quotes for $lo and $hi sats" \
    || bad "GET /loop/$dir/termsAndQuotes: ${tq:0:200}"
done

code=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -H "Authorization: Bearer $token" "$API/loop/out/quote/abc")
[ "$code" = "400" ] && ok "GET /loop/out/quote/abc -> 400" || bad "GET /loop/out/quote/abc -> $code (want 400)"

echo
echo "4. Loop Out: $SWAP_SATS sats from alice's channel to her on-chain wallet"
# The body the Loop Out dialog posts: fees from the quote, routing fees capped at
# 2% (the dialog's default), no channel or external address chosen.
routing_fee=$(( SWAP_SATS / 50 ))
prepay_routing_fee=$(( ${out_prepay:-0} / 50 + 1 ))
resp=$(api_post /loop/out "{\"amount\":$SWAP_SATS,\"targetConf\":2,\"swapRoutingFee\":$routing_fee,\"minerFee\":${out_sweep_fee:-0},\"prepayRoutingFee\":$prepay_routing_fee,\"prepayAmt\":${out_prepay:-0},\"swapFee\":${out_swap_fee:-0},\"swapPublicationDeadline\":0,\"chanId\":\"\",\"destAddress\":\"\"}")
out_id=$(echo "$resp" | jget id)
out_id_b64=$(echo "$resp" | jget id_bytes | urlsafe)
[ -n "$out_id" ] && [ -n "$(echo "$resp" | jget htlc_address)" ] \
  && ok "POST /loop/out -> swap ${out_id:0:16}..." \
  || bad "POST /loop/out: ${resp:0:300}"
if [ -n "$out_id_b64" ]; then
  state=$(wait_for_swap "$out_id_b64")
  [ "$state" = "SUCCESS" ] && ok "GET /loop/swap/:id -> SUCCESS" || bad "Loop Out ended as: $state"
else
  bad "no swap id to follow"
fi

echo
echo "5. Loop In: $SWAP_SATS sats from alice's on-chain wallet to her channel"
resp=$(api_post /loop/in "{\"amount\":$SWAP_SATS,\"swapFee\":${in_swap_fee:-0},\"minerFee\":${in_publish_fee:-0},\"lastHop\":\"\",\"externalHtlc\":true}")
in_id=$(echo "$resp" | jget id)
in_id_b64=$(echo "$resp" | jget id_bytes | urlsafe)
[ -n "$in_id" ] && ok "POST /loop/in -> swap ${in_id:0:16}..." || bad "POST /loop/in: ${resp:0:300}"
if [ -n "$in_id_b64" ]; then
  state=$(wait_for_swap "$in_id_b64")
  [ "$state" = "SUCCESS" ] && ok "GET /loop/swap/:id -> SUCCESS" || bad "Loop In ended as: $state"
else
  bad "no swap id to follow"
fi

echo
echo "6. both swaps are in the list RTL's Loop screens render"
swaps=$(api_get /loop/swaps)
for pair in "LOOP_OUT:$out_id" "LOOP_IN:$in_id"; do
  type=${pair%%:*}
  id=${pair#*:}
  found=$(echo "$swaps" | python3 -c '
import sys, json
try:
    for s in json.load(sys.stdin):
        if s.get("id") == sys.argv[1]:
            print(s.get("type", ""), s.get("state", ""))
except Exception:
    pass
' "$id")
  [ -n "$id" ] && [ "$found" = "$type SUCCESS" ] && ok "GET /loop/swaps lists the $type as SUCCESS" \
    || bad "GET /loop/swaps for $type ${id:0:16}: '${found}' (want '$type SUCCESS')"
done

code=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -H "Authorization: Bearer $token" "$API/loop/swap/not-a-swap-hash")
[ "$code" = "400" ] && ok "GET /loop/swap/not-a-swap-hash -> 400" || bad "GET /loop/swap/not-a-swap-hash -> $code (want 400)"

echo
echo "=== $pass passed, $fail failed ==="
[ "$fail" -eq 0 ]
