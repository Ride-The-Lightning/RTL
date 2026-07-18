# RTL regtest dev fixture

### NOT suitable for production. Development only. Every credential here is throwaway.

A self-contained regtest network for developing and testing RTL: `bitcoind`, three
LND nodes, a Core Lightning node, and RTL wired to all four.

```
alice --[ 5,000,000 sat ]--> bob --[ 3,000,000 sat ]--> carol
cln   --[ 4,000,000 sat ]--> alice
```

bob sits in the middle so it accrues forwarding history, which is what gives RTL's
routing screens something to show. Two nodes would leave them empty. The `cln`
(Core Lightning) node gives RTL's CLN screens a real backend — it talks to RTL over
clnrest with rune auth.

LND and bitcoind images come from [Polar](https://lightningpolar.com); the Core
Lightning image is the official [`elementsproject/lightningd`](https://hub.docker.com/r/elementsproject/lightningd).
All are multi-arch (amd64 + arm64) and nothing is built locally, so this works on
Apple Silicon.

## Requirements

Docker with Compose v2 (`docker compose`, not `docker-compose`).

## Quick start

From this directory:

```bash
docker compose up -d          # bitcoind, alice, bob, carol, cln, rtl
./scripts/seed.sh             # fund, connect, open channels, make payments
```

Then open <http://localhost:3000> — password `rtldev`. All four nodes (alice, bob,
carol, cln) appear in the node switcher.

Tear down, discarding all state:

```bash
docker compose down -v
```

## What the seed creates

| | |
|---|---|
| On-chain | 10,000,000 sats per node (LND) + 10,000,000 sats on cln, confirmed |
| Channels | alice→bob 5,000,000 sats · bob→carol 3,000,000 sats (1,000,000 pushed each) · cln→alice 4,000,000 sats |
| Routed payments | 5 × alice→carol via bob (10k, 25k, 50k, 75k, 100k sats) |
| Direct payments | 2 × alice→bob (5k, 15k sats) |
| Open invoices | 2 unpaid on carol (20k, 40k sats) |
| Personas | alice + bob + cln OPERATOR, carol MERCHANT |

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

## Not included

Eclair nodes and the Boltz swap service. Polar publishes a multi-arch `eclair` image, so
adding an Eclair node means a compose service, an RTL config entry, and a seeding adapter
— no image building.
