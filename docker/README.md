# RTL regtest dev fixture

### NOT suitable for production. Development only. Every credential here is throwaway.

A self-contained regtest network for developing and testing RTL: `bitcoind`, three
LND nodes, a Core Lightning node, an Eclair node, and RTL wired to all five.

```
alice  --[ 5,000,000 sat ]--> bob --[ 3,000,000 sat ]--> carol
cln    --[ 4,000,000 sat ]--> alice
eclair --[ 3,500,000 sat ]--> bob
```

## Topology

```mermaid
flowchart TB
    subgraph chain["Chain backend"]
        bitcoind["bitcoind (regtest)<br/>RPC · ZMQ rawblock/rawtx · ZMQ hashblock"]
    end

    subgraph ln["Lightning nodes"]
        alice["alice (LND)"]
        bob["bob (LND)<br/>forwards payments"]
        carol["carol (LND)"]
        cln["cln (Core Lightning)"]
        eclair["eclair (Eclair)"]
    end

    alice =="5M sat"==> bob
    bob =="3M sat"==> carol
    cln =="4M sat"==> alice
    eclair =="3.5M sat"==> bob

    alice -.-> bitcoind
    bob -.-> bitcoind
    carol -.-> bitcoind
    cln -.-> bitcoind
    eclair -.->|"dedicated 'eclair' wallet<br/>+ hashblock ZMQ"| bitcoind

    rtl["RTL<br/>localhost:3000"]
    rtl -->|"REST + macaroon"| alice
    rtl -->|"REST + macaroon"| bob
    rtl -->|"REST + macaroon"| carol
    rtl -->|"clnrest + rune"| cln
    rtl -->|"HTTP API + basic auth"| eclair
```

Thick arrows are channels (opener → peer), dotted arrows the chain backend each node
uses, and solid arrows how RTL reaches each node.

bob sits in the middle so it accrues forwarding history, which is what gives RTL's
routing screens something to show. Two nodes would leave them empty. The `cln`
(Core Lightning) node gives RTL's CLN screens a real backend — it talks to RTL over
clnrest with rune auth. The `eclair` node does the same for RTL's Eclair screens —
RTL talks to its HTTP API with basic auth.

LND, bitcoind and Eclair images come from [Polar](https://lightningpolar.com); the Core
Lightning image is the official [`elementsproject/lightningd`](https://hub.docker.com/r/elementsproject/lightningd).
All are multi-arch (amd64 + arm64) and nothing is built locally, so this works on
Apple Silicon. (The official `acinq/eclair` image is amd64-only and its versioned tags
are years stale, which is why Polar's build of the same source is used instead.)

## Requirements

Docker with Compose v2 (`docker compose`, not `docker-compose`).

## Quick start

From this directory:

```bash
docker compose up -d          # bitcoind, alice, bob, carol, cln, eclair, rtl
./scripts/seed.sh             # fund, connect, open channels, make payments
```

Then open <http://localhost:3000> — password `rtldev`. All five nodes (alice, bob,
carol, cln, eclair) appear in the node switcher.

Tear down, discarding all state:

```bash
docker compose down -v
```

## What the seed creates

| | |
|---|---|
| On-chain | 10,000,000 sats per node (LND) + 10,000,000 sats each on cln and eclair, confirmed |
| Channels | alice→bob 5,000,000 · bob→carol 3,000,000 · eclair→bob 3,500,000 sats (1,000,000 pushed each) · cln→alice 4,000,000 sats (no push) |
| Routed payments | 5 × alice→carol via bob (10k, 25k, 50k, 75k, 100k sats) |
| Direct payments | 2 × alice→bob (5k, 15k sats) · 2 × eclair→bob (8k, 18k sats) |
| Open invoices | 2 unpaid on carol (20k, 40k sats) · 1 unpaid on eclair (30k sats) |
| Personas | alice + bob + cln + eclair OPERATOR, carol MERCHANT |

## Determinism

Every amount and payment in `scripts/seed.sh` is fixed. A fresh run always produces
identical state, so screenshots taken before and after a change differ only by the
change. **Do not introduce randomness.**

The seed is deterministic but deliberately *not* idempotent — running it twice would
fund every node again and open a second set of channels. It refuses to run against an
already-seeded network. To start over:

```bash
docker compose down -v && docker compose up -d && ./scripts/seed.sh
```

## Helpers

```bash
bin/b-cli getblockcount                    # bitcoin-cli
bin/b-cli -rpcwallet=rtldev getbalance
bin/ln-cli alice getinfo                   # lncli, node name required
bin/ln-cli bob listchannels
bin/ln-cli bob fwdinghistory               # forwarding history
bin/e-cli getinfo                          # eclair-cli
bin/e-cli channels
docker compose exec cln lightning-cli --network=regtest listpeerchannels   # Core Lightning
```

Logs:

```bash
docker compose logs -f rtl
docker compose logs alice
```

## Notes and gotchas

**RTL's config.** `rtl/RTL-Config.regtest.json` is the tracked template. RTL rewrites
its config on startup, so an init container copies it into a volume rather than
bind-mounting it — a read-only mount makes RTL exit with `EROFS`, and a writable one
would let RTL modify a version-controlled file. The name is not `RTL-Config.json`
because `.gitignore` matches that bare filename at any depth.

**`lncli` needs `--lnddir=/home/lnd/.lnd`.** `docker compose exec` lands as root,
whose HOME is `/root`, but lnd's datadir is `/home/lnd/.lnd`. `bin/ln-cli` handles this.

**Changing bitcoind credentials.** `docker-compose.yml` carries an `-rpcauth` hash for
the `BITCOIN_RPC_USER` / `BITCOIN_RPC_PASSWORD` in `.env`. Changing them there is not
enough; regenerate the hash:

```bash
python3 - <<'EOF'
import hmac, hashlib
user, password, salt = "rtldev", "rtldev", "8a1f2c3d4e5b6a7c8d9e0f1a2b3c4d5e"
print(f"{user}:{salt}${hmac.new(salt.encode(), password.encode(), hashlib.sha256).hexdigest()}")
EOF
```

In `docker-compose.yml` the `$` must be written `$$` to escape Compose interpolation.

**Payments right after channel open will fail.** The channel graph has to reach alice
before she can route to carol. The seed waits for this; anything you script yourself
should too.

**Core Lightning auth uses a rune.** RTL talks to `cln` over clnrest and authenticates
with a rune, not a macaroon. `cln/create-rune.sh` — run from the `cln` healthcheck —
creates a master rune once the RPC is up and writes it as `LIGHTNING_RUNE="…"` to
`rtl.rune` in the shared `cln_data` volume; RTL reads it via the `runePath` in its config.
The healthcheck reports unhealthy until that file exists, so RTL (which waits on
`service_healthy`) starts only once the rune is ready. Because it runs on every
healthcheck tick (idempotent), a transient RPC-startup race just retries and self-heals
rather than wedging the stack. `--clnrest-host=0.0.0.0` is required for RTL (another
container) to reach clnrest; the default `127.0.0.1` would only be reachable from inside
the node.

**Eclair has no wallet of its own.** It drives a bitcoind wallet over RPC. The
`eclair-wallet-init` service creates a dedicated `eclair` wallet before the node starts;
without it eclair would attach to "the default loaded wallet" — the `rtldev` mining
wallet — and report the miner's balance as its own. RTL authenticates to eclair with
`lnApiPassword` (HTTP basic auth), no file mount needed. Eclair also confirms channels
at 8 blocks (`channel.min-depth-blocks`), not 6 — the seed mines accordingly. And its
`bitcoind.zmqblock` must point at a `zmqpubhashblock` endpoint — wired to the rawblock
one LND uses, eclair never sees new blocks and channels never confirm.

## Not included

The Boltz swap service.
