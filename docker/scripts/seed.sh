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
#   alice --[ 5,000,000 sat ]--> bob --[ 3,000,000 sat ]--> carol
#
# bob sits in the middle so it accrues forwarding history, which is what
# populates RTL's routing screens.
#
# Usage:  ./scripts/seed.sh          (from the docker/ directory)

set -euo pipefail

cd "$(dirname "$0")/.."

BITCOIN_RPC_USER="${BITCOIN_RPC_USER:-rtldev}"
BITCOIN_RPC_PASSWORD="${BITCOIN_RPC_PASSWORD:-rtldev}"

NODES=(alice bob carol)

# Deterministic scenario constants
FUND_SATS=10000000           # on-chain funding per node
CH_ALICE_BOB=5000000         # channel capacity alice -> bob
CH_BOB_CAROL=3000000         # channel capacity bob -> carol
PUSH_SATS=1000000            # pushed to remote on open, so both sides have liquidity
MINE_CONFIRM=6               # blocks to confirm a funding tx

log()  { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
info() { printf '    %s\n' "$*"; }
die()  { printf '\n\033[1;31mERROR:\033[0m %s\n' "$*" >&2; exit 1; }

bcli() {
  docker compose exec -T bitcoind bitcoin-cli -regtest \
    -rpcuser="$BITCOIN_RPC_USER" -rpcpassword="$BITCOIN_RPC_PASSWORD" "$@"
}

# 'docker compose exec' lands as root, whose HOME is /root, but lnd's datadir is
# /home/lnd/.lnd -- so lncli must be told where to find the cert and macaroon.
lncli() {
  local node=$1; shift
  docker compose exec -T "$node" lncli --network=regtest --lnddir=/home/lnd/.lnd "$@"
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
BOB_PUB=$(pubkey_of bob)
CAROL_PUB=$(pubkey_of carol)
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

# ---------------------------------------------------------------- summary

log "Seed complete"
for n in "${NODES[@]}"; do
  chans=$(lncli "$n" listchannels | grep -c '"active":  *true' || true)
  bal=$(lncli "$n" walletbalance | json_first confirmed_balance)
  printf '    %-6s  channels: %-3s  on-chain: %s sats\n' "$n" "${chans:-0}" "${bal:-0}"
done
# '|| echo 0' would be wrong here: grep -c already prints 0 when it finds nothing
# and then exits 1, so the echo would append a second line.
fwds=$(lncli bob fwdinghistory | grep -c '"chan_id_in"' || true)
printf '    bob forwarded %s payment(s)\n' "${fwds:-0}"
printf '\n    RTL: http://localhost:%s  (password: %s)\n\n' "${RTL_PORT:-3000}" "${RTL_PASSWORD:-password}"
