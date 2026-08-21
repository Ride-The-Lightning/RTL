#!/usr/bin/env bash
#
# Seed the regtest fixture with a deterministic scenario.
#
# Every amount, capacity and payment below is fixed on purpose. Re-running this
# against a fresh network must produce the same state, so that screenshots taken
# now and after a redesign differ only by the design. Do not introduce randomness.
#
# Topology:
#
#   alice  --[ 5,000,000 sat ]--> bob --[ 3,000,000 sat ]--> carol
#   cln    --[ 4,000,000 sat ]--> alice
#   eclair --[ 3,500,000 sat ]--> bob
#
# bob sits in the middle so it accrues forwarding history, which is what
# populates RTL's routing screens.
#
# Usage:  ./scripts/seed.sh          (from the docker/ directory)

set -euo pipefail

cd "$(dirname "$0")/.."

# Docker Compose reads .env by itself; bash does not. Without this the defaults
# below silently win, and the summary at the end prints a password that does not
# work.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

BITCOIN_RPC_USER="${BITCOIN_RPC_USER:-rtldev}"
BITCOIN_RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-rtldev}"
ECLAIR_API_PASSWORD="${ECLAIR_API_PASSWORD:-rtldev}"

NODES=(alice bob carol)

# Deterministic scenario constants
FUND_SATS=10000000           # on-chain funding per node
CH_ALICE_BOB=5000000         # channel capacity alice -> bob
CH_BOB_CAROL=3000000         # channel capacity bob -> carol
CH_CLN_ALICE=4000000         # channel capacity cln -> alice (Core Lightning node)
CH_ECL_BOB=3500000           # channel capacity eclair -> bob (Eclair node)
PUSH_SATS=1000000            # pushed to remote on open, so both sides have liquidity
MINE_CONFIRM=6               # blocks to confirm a funding tx
ECL_MINE_CONFIRM=8           # eclair's channel.min-depth-blocks default is 8, not 6

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die()  { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

bcli() {
  docker compose exec -T bitcoind bitcoin-cli -regtest \
    -rpcuser="$BITCOIN_RPC_USER" -rpcpassword="$BITCOIN_RPC_PASSWORD" "$@"
}

# --lnddir is passed explicitly rather than relying on lncli's ~/.lnd default, so this
# keeps working if the image's datadir moves again -- Polar used /home/lnd/.lnd, and
# without the flag lncli looks for the TLS cert and macaroon in the wrong place.
lncli() {
  local node=$1; shift
  docker compose exec -T "$node" lncli --network=regtest --lnddir=/root/.lnd "$@"
}

# Core Lightning cli. Runs inside the cln container against the regtest node.
clncli() {
  docker compose exec -T cln lightning-cli --network=regtest "$@"
}

# Eclair cli. Runs inside the eclair container; auths with the API password.
ecli() {
  docker compose exec -T eclair eclair-cli -p "$ECLAIR_API_PASSWORD" "$@"
}

# Extract the first value for a JSON key from lncli output.
# 'first' matters: walletbalance reports confirmed_balance at the top level AND
# again under account_balance.default, and lncli emits no --json flag we can use.
json_first() {
  grep -o "\"$1\": *\"[^\"]*\"" | head -1 | sed -e 's/^[^:]*: *"//' -e 's/"$//'
}

# Wait for a command to succeed, up to N attempts.
wait_for() {
  local desc=$1 attempts=$2; shift 2
  local i=1
  while (( i <= attempts )); do
    if "$@" >/dev/null 2>&1; then
      info "$desc ready (${i}s)"
      return 0
    fi
    sleep 1
    (( i++ ))
  done
  die "timed out after ${attempts}s waiting for: $desc"
}

# ---------------------------------------------------------------- bitcoind

log "Waiting for bitcoind"
wait_for "bitcoind RPC" 60 bcli getblockchaininfo

log "Preparing wallet"
if ! bcli listwallets | grep -q '"rtldev"'; then
  bcli createwallet rtldev >/dev/null 2>&1 || bcli loadwallet rtldev >/dev/null
fi
info "wallet rtldev present"

MINE_ADDR=$(bcli -rpcwallet=rtldev getnewaddress)
info "mining address: $MINE_ADDR"

HEIGHT=$(bcli getblockcount)
if (( HEIGHT < 101 )); then
  log "Mining 101 blocks (coinbase maturity)"
  bcli -rpcwallet=rtldev generatetoaddress 101 "$MINE_ADDR" >/dev/null
else
  info "chain already at height $HEIGHT, skipping initial mine"
fi

# ---------------------------------------------------------------- lnd nodes

log "Waiting for LND nodes"
for n in "${NODES[@]}"; do
  wait_for "$n" 120 lncli "$n" getinfo
done

# This script is deterministic, not idempotent: running it twice would fund every
# node again and open a second set of channels. Refuse rather than corrupt the
# fixture, since the whole point is that a fresh run reproduces identical state.
if lncli alice listchannels | grep -q '"chan_id"'; then
  die "network is already seeded -- re-running would double-fund it.
    Reset with:  docker compose down -v && docker compose up -d && ./scripts/seed.sh"
fi

log "Funding nodes (${FUND_SATS} sats each)"
BTC_AMOUNT=$(awk "BEGIN{printf \"%.8f\", $FUND_SATS/100000000}")
for n in "${NODES[@]}"; do
  addr=$(lncli "$n" newaddress p2wkh | json_first address)
  [ -n "$addr" ] || die "could not get address for $n"
  bcli -rpcwallet=rtldev sendtoaddress "$addr" "$BTC_AMOUNT" >/dev/null
  info "$n <- $BTC_AMOUNT BTC ($addr)"
done

bcli -rpcwallet=rtldev generatetoaddress "$MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $MINE_CONFIRM blocks to confirm funding"

log "Waiting for confirmed on-chain balances"
for n in "${NODES[@]}"; do
  for i in $(seq 1 60); do
    bal=$(lncli "$n" walletbalance | json_first confirmed_balance)
    bal=${bal:-0}
    (( bal > 0 )) && { info "$n confirmed balance: $bal sats"; break; }
    sleep 1
    (( i == 60 )) && die "$n never saw confirmed funds"
  done
done

# ---------------------------------------------------------------- peers

pubkey_of() {
  lncli "$1" getinfo | json_first identity_pubkey
}

log "Connecting peers"
ALICE_PUB=$(pubkey_of alice)
BOB_PUB=$(pubkey_of bob)
CAROL_PUB=$(pubkey_of carol)
info "alice pubkey: $ALICE_PUB"
info "bob   pubkey: $BOB_PUB"
info "carol pubkey: $CAROL_PUB"

lncli alice connect "${BOB_PUB}@bob:9735"   >/dev/null 2>&1 || info "alice->bob already connected"
lncli bob   connect "${CAROL_PUB}@carol:9735" >/dev/null 2>&1 || info "bob->carol already connected"
info "peers connected"

# ---------------------------------------------------------------- channels

log "Opening channels"
lncli alice openchannel --node_key="$BOB_PUB" \
  --local_amt="$CH_ALICE_BOB" --push_amt="$PUSH_SATS" >/dev/null
info "alice -> bob   ${CH_ALICE_BOB} sats (push ${PUSH_SATS})"

lncli bob openchannel --node_key="$CAROL_PUB" \
  --local_amt="$CH_BOB_CAROL" --push_amt="$PUSH_SATS" >/dev/null
info "bob   -> carol ${CH_BOB_CAROL} sats (push ${PUSH_SATS})"

bcli -rpcwallet=rtldev generatetoaddress "$MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $MINE_CONFIRM blocks to confirm channels"

log "Waiting for channels to become active"
for n in alice bob; do
  for i in $(seq 1 60); do
    active=$(lncli "$n" listchannels | grep -c '"active":  *true' || true)
    (( active > 0 )) && { info "$n has $active active channel(s)"; break; }
    sleep 1
    (( i == 60 )) && die "$n has no active channels"
  done
done

# ---------------------------------------------------------------- payments

# alice can only route to carol once the bob->carol channel has been announced and
# reached her graph. Channels are confirmed by now, but gossip is not instant --
# --trickledelay alone is 5s. Paying before this lands fails with "no route".
log "Waiting for the channel graph to reach alice"
for i in $(seq 1 90); do
  edges=$(lncli alice describegraph | grep -c '"channel_id"' || true)
  (( ${edges:-0} >= 2 )) && { info "alice sees ${edges} channels in her graph"; break; }
  sleep 1
  (( i == 90 )) && die "channel graph never propagated to alice"
done

# Fixed amounts. alice -> carol routes through bob, generating forwarding history.
log "Sending payments (alice -> carol, routed via bob)"
for amt in 10000 25000 50000 75000 100000; do
  inv=$(lncli carol addinvoice --amt="$amt" --memo="seed payment ${amt} sats" \
        | json_first payment_request)
  if lncli alice payinvoice --force --pay_req="$inv" >/dev/null 2>&1; then
    info "alice -> carol  ${amt} sats  (routed)"
  else
    info "alice -> carol  ${amt} sats  FAILED (route not ready?)"
  fi
done

log "Sending direct payments (alice -> bob)"
for amt in 5000 15000; do
  inv=$(lncli bob addinvoice --amt="$amt" --memo="direct payment ${amt} sats" \
        | json_first payment_request)
  lncli alice payinvoice --force --pay_req="$inv" >/dev/null 2>&1 \
    && info "alice -> bob    ${amt} sats" \
    || info "alice -> bob    ${amt} sats  FAILED"
done

# Unsettled invoices, so the invoice list shows more than one state.
log "Creating open (unpaid) invoices on carol"
for amt in 20000 40000; do
  lncli carol addinvoice --amt="$amt" --memo="open invoice ${amt} sats" >/dev/null
  info "carol open invoice ${amt} sats"
done

# ---------------------------------------------------------------- core lightning

# A Core Lightning node with one active channel, so RTL's CLN screens have data.
# An active (peer_connected) channel is what exercises the connection-status column.
log "Waiting for Core Lightning node"
wait_for "cln" 120 clncli getinfo

log "Funding Core Lightning (${FUND_SATS} sats)"
CLN_ADDR=$(clncli newaddr | json_first bech32)
[ -n "$CLN_ADDR" ] || die "could not get address for cln"
bcli -rpcwallet=rtldev sendtoaddress "$CLN_ADDR" "$BTC_AMOUNT" >/dev/null
info "cln <- $BTC_AMOUNT BTC ($CLN_ADDR)"
bcli -rpcwallet=rtldev generatetoaddress "$MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $MINE_CONFIRM blocks to confirm cln funding"

log "Waiting for cln confirmed on-chain balance"
for i in $(seq 1 60); do
  clncli listfunds | grep -q '"status": "confirmed"' && { info "cln funds confirmed"; break; }
  sleep 1
  (( i == 60 )) && die "cln never saw confirmed funds"
done

log "Opening channel cln -> alice"
clncli connect "${ALICE_PUB}@alice:9735" >/dev/null 2>&1 || info "cln->alice already connected"
clncli fundchannel "$ALICE_PUB" "$CH_CLN_ALICE" >/dev/null
info "cln -> alice ${CH_CLN_ALICE} sats"
bcli -rpcwallet=rtldev generatetoaddress "$MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $MINE_CONFIRM blocks to confirm the cln channel"

log "Waiting for the cln channel to become active"
for i in $(seq 1 90); do
  if clncli listpeerchannels | grep -o '"state": "[A-Z_]*"' | grep -q "CHANNELD_NORMAL"; then
    info "cln channel is CHANNELD_NORMAL"; break
  fi
  sleep 1
  (( i == 90 )) && die "cln channel never reached CHANNELD_NORMAL"
done

# ---------------------------------------------------------------- eclair

# An Eclair node with one active channel to bob plus a couple of settled and
# open invoices, so RTL's Eclair screens have data. Eclair's on-chain wallet is
# the dedicated "eclair" bitcoind wallet (created by eclair-wallet-init), but
# funding still goes through eclair's own API so its balances update.
log "Waiting for Eclair node"
wait_for "eclair" 180 ecli getinfo

log "Funding Eclair (${FUND_SATS} sats)"
ECL_ADDR=$(ecli getnewaddress | tr -d '"')
[ -n "$ECL_ADDR" ] || die "could not get address for eclair"
bcli -rpcwallet=rtldev sendtoaddress "$ECL_ADDR" "$BTC_AMOUNT" >/dev/null
info "eclair <- $BTC_AMOUNT BTC ($ECL_ADDR)"
bcli -rpcwallet=rtldev generatetoaddress "$MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $MINE_CONFIRM blocks to confirm eclair funding"

log "Waiting for eclair confirmed on-chain balance"
for i in $(seq 1 60); do
  ecli onchainbalance | grep -q '"confirmed": *[1-9]' && { info "eclair funds confirmed"; break; }
  sleep 1
  (( i == 60 )) && die "eclair never saw confirmed funds"
done

log "Opening channel eclair -> bob"
ecli connect --uri="${BOB_PUB}@bob:9735" >/dev/null 2>&1 || info "eclair->bob already connected"
ecli open --nodeId="$BOB_PUB" --fundingSatoshis="$CH_ECL_BOB" --pushMsat=$(( PUSH_SATS * 1000 )) >/dev/null
info "eclair -> bob ${CH_ECL_BOB} sats (push ${PUSH_SATS})"

# 'open' returns before eclair broadcasts the funding tx; mining too early would
# confirm nothing and leave the channel waiting forever.
for i in $(seq 1 30); do
  bcli getrawmempool | grep -q '"' && { info "funding tx in mempool"; break; }
  sleep 1
  (( i == 30 )) && die "eclair funding tx never reached the mempool"
done
bcli -rpcwallet=rtldev generatetoaddress "$ECL_MINE_CONFIRM" "$MINE_ADDR" >/dev/null
info "mined $ECL_MINE_CONFIRM blocks to confirm the eclair channel"

log "Waiting for the eclair channel to become active"
for i in $(seq 1 90); do
  if ecli channels | grep -q '"state" *: *"NORMAL"'; then
    info "eclair channel is NORMAL"; break
  fi
  sleep 1
  (( i == 90 )) && die "eclair channel never reached NORMAL"
done

# Direct payments over the eclair->bob channel; no routing, so no gossip wait.
# payinvoice is asynchronous -- confirm settlement on bob's side.
log "Sending direct payments (eclair -> bob)"
for amt in 8000 18000; do
  inv_out=$(lncli bob addinvoice --amt="$amt" --memo="eclair payment ${amt} sats")
  inv=$(echo "$inv_out" | json_first payment_request)
  rhash=$(echo "$inv_out" | json_first r_hash)
  ecli payinvoice --invoice="$inv" >/dev/null 2>&1
  paid=""
  for i in $(seq 1 30); do
    if lncli bob lookupinvoice "$rhash" | grep -q '"state": *"SETTLED"'; then
      paid=1; break
    fi
    sleep 1
  done
  [ -n "$paid" ] && info "eclair -> bob  ${amt} sats" \
                 || info "eclair -> bob  ${amt} sats  FAILED (never settled)"
done

# An unpaid invoice, so the eclair invoice list shows more than one state.
log "Creating an open (unpaid) invoice on eclair"
ecli createinvoice --amountMsat=$(( 30000 * 1000 )) --description="open invoice 30000 sats" >/dev/null
info "eclair open invoice 30000 sats"

# ---------------------------------------------------------------- summary

log "Seed complete"
for n in "${NODES[@]}"; do
  chans=$(lncli "$n" listchannels | grep -c '"active":  *true' || true)
  bal=$(lncli "$n" walletbalance | json_first confirmed_balance)
  printf '    %-6s  channels: %-3s  on-chain: %s sats\n' "$n" "${chans:-0}" "${bal:-0}"
done
cln_chans=$(clncli listpeerchannels | grep -o '"state": "[A-Z_]*"' | grep -c "CHANNELD_NORMAL" || true)
printf '    %-6s  channels: %-3s  (Core Lightning)\n' "cln" "${cln_chans:-0}"
ecl_chans=$(ecli channels | grep -o '"state" *: *"NORMAL"' | grep -c NORMAL || true)
printf '    %-6s  channels: %-3s  (Eclair)\n' "eclair" "${ecl_chans:-0}"
# '|| echo 0' would be wrong here: grep -c already prints 0 when it finds nothing
# and then exits 1, so the echo would append a second line.
fwds=$(lncli bob fwdinghistory | grep -c '"chan_id_in"' || true)
printf '    bob forwarded %s payment(s)\n' "${fwds:-0}"
printf '\n    RTL: http://localhost:%s  (password: %s)\n\n' "${RTL_PORT:-3000}" "${RTL_PASSWORD:-password}"
