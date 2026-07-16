# RTL regtest dev fixture

### NOT suitable for production. Development only. Every credential here is throwaway.

A self-contained regtest network for developing and testing RTL: `bitcoind`, three
LND nodes, and RTL wired to all three.

```
alice --[ 5,000,000 sat ]--> bob --[ 3,000,000 sat ]--> carol
```

bob sits in the middle so it accrues forwarding history, which is what gives RTL's
routing screens something to show. Two nodes would leave them empty.

Node images come from [Polar](https://lightningpolar.com), which publishes multi-arch
(amd64 + arm64) builds. Nothing is built locally, so this works on Apple Silicon.

## Requirements

Docker with Compose v2 (`docker compose`, not `docker-compose`).

## Quick start

From this directory:

```bash
docker compose up -d          # bitcoind, alice, bob, carol, rtl
./scripts/seed.sh             # fund, connect, open channels, make payments
```

Then open <http://localhost:3000> — password `rtldev`. All three nodes appear in
the node switcher.

Tear down, discarding all state:

```bash
docker compose down -v
```

## What the seed creates

| | |
|---|---|
| On-chain | 10,000,000 sats per node, confirmed |
| Channels | alice→bob 5,000,000 sats · bob→carol 3,000,000 sats (1,000,000 pushed each) |
| Routed payments | 5 × alice→carol via bob (10k, 25k, 50k, 75k, 100k sats) |
| Direct payments | 2 × alice→bob (5k, 15k sats) |
| Open invoices | 2 unpaid on carol (20k, 40k sats) |
| Personas | alice + bob OPERATOR, carol MERCHANT |

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

## Not included

Core Lightning and Eclair nodes, and the Boltz swap service. Polar publishes
multi-arch `clightning` and `eclair` images, so adding them means compose services,
RTL config entries, and seeding adapters — no image building.
