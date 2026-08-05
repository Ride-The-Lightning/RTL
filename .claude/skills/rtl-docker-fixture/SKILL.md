---
name: rtl-docker-fixture
description: Bring up and use the docker/ regtest fixture (bitcoind + LND alice/bob/carol + Core Lightning + Eclair + RTL) to test RTL end-to-end. Use when testing a branch against real Lightning nodes, seeding channels and payments, driving RTL's API for verification, taking screenshots of live data, or reproducing disconnected-peer states.
---

# Testing against a live network — `docker/` regtest fixture

`docker/` is a self-contained regtest network for developing and testing RTL end-to-end:
`bitcoind` + three LND nodes (**alice → bob → carol**) + a **Core Lightning node** (`cln`,
with a channel to alice) + RTL wired to all four. bob sits in the middle so it accrues
forwarding history and RTL's routing screens have data; the CLN node gives RTL's Core
Lightning screens a real backend (it talks to RTL over clnrest with rune auth). LND/bitcoind
images come from [Polar](https://lightningpolar.com), CLN from `elementsproject/lightningd`
(all multi-arch, so it works on Apple Silicon). **Dev only; every credential is throwaway.**
Full details in `docker/README.md`.

Bring it up (from `docker/`, needs Compose v2 — `docker compose`, not `docker-compose`):

```bash
docker compose up -d          # bitcoind, alice, bob, carol, cln, rtl
./scripts/seed.sh             # fund, connect, open channels, make payments
```

Then open <http://localhost:3000>, password `rtldev`; all four nodes show in the switcher.
Reset to a clean slate: `docker compose down -v && docker compose up -d && ./scripts/seed.sh`.

Helpers and logs:

```bash
bin/b-cli getblockcount              # bitcoin-cli
bin/ln-cli alice getinfo             # lncli (node name required; handles --lnddir)
bin/ln-cli bob fwdinghistory
docker compose logs -f rtl
```

Testing the **BTCPay Server integration** (RTL in single-sign-on mode behind a proxy) —
behind a compose profile, so a plain `up` does not start it:

```bash
docker compose --profile sso up -d
./scripts/verify-sso.sh       # 11 assertions over the whole entry path; non-zero on failure
open "$(bin/sso-url)"         # the link BTCPay renders on its Services page
```

Key facts when working with the fixture:

- **Run `scripts/verify-sso.sh` after touching authentication, CSRF or static serving.**
  BTCPay reaches RTL over a path the standalone login never exercises — a rotating cookie
  file, an unregistered `/rtl/api/authenticate/cookie` URL that falls through to the
  catch-all in `server/utils/app.ts`, and a reverse proxy. Note `GET /rtl/` is served by
  `express.static` and mints **no** `XSRF-TOKEN`; only the catch-all does, so a client
  entering there 403s on its first POST. That is long-standing, not a regression.
- **`scripts/seed.sh` is deterministic but not idempotent.** Every amount is fixed, so a
  fresh run always produces identical state (screenshots differ only by your change) — so
  **do not introduce randomness**. It refuses to run twice against an already-seeded
  network; use the `down -v` reset above to start over.
- Seed creates: 10M sat on-chain per node; channels alice→bob (5M), bob→carol (3M),
  cln→alice (4M) and eclair→bob (3.5M); 5 routed alice→carol payments + 2 direct
  alice→bob + 2 direct eclair→bob; 2 unpaid invoices on carol + 1 on eclair;
  carol as MERCHANT, everyone else OPERATOR.
- **`rtl/RTL-Config.regtest.json`** is the tracked config template. RTL rewrites its config
  on startup, so an init container copies it into a volume rather than bind-mounting it
  (a read-only mount → `EROFS`; a writable one would edit a tracked file). It's not named
  `RTL-Config.json` because `.gitignore` matches that bare name at any depth.
- **Payments right after a channel opens fail** until the graph propagates to the sender;
  the seed waits for this and so should anything you script.
- **Eclair node** (`eclair`, `polarlightning/eclair` — the official `acinq/eclair` image is
  amd64-only and stale): RTL talks to its HTTP API with basic auth (`lnApiPassword`). Eclair
  has no wallet of its own — `eclair-wallet-init` creates a dedicated `eclair` bitcoind
  wallet before it starts, else it grabs the mining wallet. Its channels confirm at 8 blocks
  (`channel.min-depth-blocks`), not 6. Helper: `bin/e-cli <eclair-cli args>`.
- **Not included:** the Boltz swap service.

## Testing an unreleased branch against the fixture

The `rtl` service defaults to a published image but is overridable — build your branch and
point the fixture at it:

```bash
docker build -t rtl:pr .      # from repo root (RTL/)
cd docker && RTL_IMAGE=rtl:pr docker compose up -d
```

To confirm your change is actually running, grep inside the container: compiled backend at
`/RTL/backend/...`, built frontend bundle at `/RTL/frontend/*.js`.

- **Reproduce a disconnected CLN channel** (to exercise `peer_connected` states): the `cln`
  node has a channel to alice, so `docker compose stop alice` flips it to disconnected within
  ~1s. Gotcha: **`docker compose up -d rtl` restarts stopped dependencies** (rtl `depends_on`
  them), silently reconnecting the peer — don't re-run `up` on rtl mid-test. Restore with
  `docker compose start alice`.
- **Driving RTL's API for verification** (host→container network is often blocked; run a Node
  script via `docker compose exec -T rtl node < script.js`): the base href is `/rtl`, so all
  API paths are `/rtl/api/...`; auth needs the CSRF handshake (`GET /` for the `XSRF-TOKEN`,
  echoed as an `x-xsrf-token` header) and a **SHA256-hashed** password; and you must call
  `/rtl/api/cln/getinfo` before CLN channel endpoints (it initializes the session's rune auth,
  else `listPeerChannels` 401s). Prefer verifying the data layer (API) separately from frontend
  rendering — a template can crash mid-render while the API returns correct data.
