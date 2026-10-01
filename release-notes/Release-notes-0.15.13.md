# Release Notes — 0.15.13

This document collects the changes that go into the 0.15.13 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Removals

- **The Boltz integration is removed**
  ([#1726](https://github.com/Ride-The-Lightning/RTL/pull/1726), closes
  [#1724](https://github.com/Ride-The-Lightning/RTL/issues/1724)).
  Boltz suspended its swap service on 3 August 2026 and it has not returned; the `boltz-client`
  daemon RTL talked to has no service behind it, so no swap could be created and none of the
  integration could be tested. The Services > Boltz pages, the `/api/boltz/*` endpoints
  (`server/controllers/shared/boltz.ts`) and the `boltzServerUrl` / `boltzMacaroonPath` settings
  are gone, along with their documentation. **Operator note:** a config file or environment
  that still sets `boltzServerUrl`, `boltzMacaroonPath`, `BOLTZ_SERVER_URL` or
  `BOLTZ_MACAROON_PATH` keeps working: RTL ignores those settings and prints one line at
  start-up saying so. They can be deleted, and a bundled `boltz-client` container is no longer
  used by RTL. `test/backend/boltz-removed.test.mjs` covers the start-up notice and the removed
  routes.

## Bug Fixes

- **LND wallet initialisation failed for some seed passphrases**
  ([#1728](https://github.com/Ride-The-Lightning/RTL/pull/1728)).
  The Initialize Wallet screen sent the optional seed passphrase, base64-encoded, as a segment
  of the request path, and `genSeed` in `server/controllers/lnd/wallet.ts` put it into the LND
  URL as it was. A passphrase whose base64 form holds `+` or `/` therefore did not reach LND
  intact: seed generation answered "illegal base64 data", or the wallet could not be
  initialised afterwards ("invalid passphrase"). The passphrase now travels in the request
  body, as it already did for `initwallet`, and goes to LND as an encoded query value; the
  seed request is a `POST /api/lnd/wallet/genseed`. The seed and wallet-init log lines now
  carry the event only. `test/backend/lnd-wallet.test.mjs` covers it.

- **Core Lightning and Eclair payment lists started one node call per entry all at once**
  ([#1725](https://github.com/Ride-The-Lightning/RTL/pull/1725); follow-up to #1722).
  `listPayments` in `server/controllers/cln/payments.ts` decodes the bolt11 of every payment to
  show its memo, and `getSentPaymentsInformation` in `server/controllers/eclair/payments.ts`
  asks for the sent info of every payment hash it is given. Both started all of those calls at
  once, through a helper that worked from the controller's shared options object, which on a
  multi-node RTL another request may have replaced by the time a call ran. They now run at most
  20 calls at a time through `runWithConcurrencyLimit`, as the peer and channel lists already
  do, and each call gets a copy of the request's own options. The Eclair endpoint also answers
  400 when `payments` is not a string, and only asks the node about entries that are payment
  hashes. `test/backend/cln-list-payments.test.mjs` and
  `test/backend/eclair-sent-payments.test.mjs` cover both.

- **LND lookups forwarded a malformed path value to the node as it was**
  ([#1722](https://github.com/Ride-The-Lightning/RTL/pull/1722); follow-up to #1713).
  The node, channel and route lookups in `server/controllers/lnd/graph.ts`, payment decode and
  payment lookup in `server/controllers/lnd/payments.ts`, and peer disconnect in
  `server/controllers/lnd/peers.ts` put their path parameter into the LND URL without checking
  it, so a value that was not a public key, channel id, amount, payment request or payment hash
  could change which LND request was made. Each handler now checks the value's form and answers
  400 otherwise, through a small `parsePathParam` helper in `server/utils/common.ts`; the two
  list endpoints (aliases for a list of public keys, decode for a list of payment requests) skip
  the entries that do not fit, and the decode list now asks LND for at most 20 entries at a time
  (it started every call at once), as the other list handlers do. Surrounding whitespace, which LND ignored, is dropped rather than
  refused, so a pasted payment request with a trailing newline still decodes. RTL's own screens
  are unaffected, except that a mistyped lookup key now gets RTL's 400 instead of LND's error.
  `test/backend/lnd-path-params.test.mjs` covers every handler.

- **Core Lightning: stricter validation of BOLT 12 offer payments**
  ([#1720](https://github.com/Ride-The-Lightning/RTL/pull/1720)).
  The invoice fetched for an offer is now validated before it is paid, both in the backend
  (`server/controllers/cln/payments.ts`) and in the Send Payment dialog.
  `test/backend/cln-offer-payment.test.mjs` and a new send-payment component spec cover it.

- **An invalid channel point could crash RTL during an LND channel backup**
  ([#1718](https://github.com/Ride-The-Lightning/RTL/pull/1718)).
  The backup, verify and restore handlers in `server/controllers/lnd/channelsBackup.ts` built a
  file path from the request's `channelPoint` without checking it. A malformed value could make
  the backup write fail in a way that stopped the process, or make verify/restore read a file
  outside the backup folder. The id is now checked against the `txid:output_index` outpoint form
  (or `ALL`), the resolved path must stay inside `channelBackupPath`, and a failed backup write
  answers with an error. `test/backend/lnd-channel-backup.test.mjs` covers all three handlers.

- **Loop requests could go to another node's swap server, and the missing-URL guard never fired**
  ([#1715](https://github.com/Ride-The-Lightning/RTL/pull/1715), fixes
  [#1714](https://github.com/Ride-The-Lightning/RTL/issues/1714)).
  `server/controllers/shared/loop.ts` kept one module-level options object, assigned only by
  `loopInfo` and reused by the other ten handlers. In a multi-node RTL a request made while
  node B was selected went to node A's Loop server with A's `loop.macaroon`, and the "Loop
  Server URL is missing" check tested `options.url`, a key `setSwapServerOptions` never sets,
  so a node with no `swapServerUrl` was sent upstream with no base URL. Every handler now
  builds its options from the session's selected node on each request (as the LND and Boltz
  controllers already do) and answers 500 before any upstream call when the URL is not
  configured. A quote request no longer needs a prior `/loop/info` call, and `swap` checks
  that its `id` path parameter is a URL-safe base64 swap hash (the form the swaps view sends
  and Loop's REST route decodes) before it goes into the URL.
  `test/backend/loop-options.test.mjs` covers the missing-URL case and a node switch.

- **Omitted query parameters were sent upstream as the string `"undefined"`**
  ([#1713](https://github.com/Ride-The-Lightning/RTL/pull/1713), fixes
  [#1698](https://github.com/Ride-The-Lightning/RTL/issues/1698); follow-up to #1687).
  The remaining handlers that glued `req.query`/`req.params` into the LND or Loop URL —
  `invoiceLookup`, `getNewAddress`, `closeChannel`, `getUTXOs` and the four Loop quote
  endpoints — interpolated an absent value as `undefined` (LND answers 400) and let a value
  containing `&` add parameters upstream. RTL's own frontend always sends these parameters, so
  this only affected direct API callers. Each handler now builds its query through the
  request wrapper's `qs` (axios encodes it), omits what is absent so the node applies its own
  default (an empty value counts as absent, as before), and answers 400 for a malformed value
  via three small parsers added to `server/utils/common.ts`; `closeChannel` also checks that
  its `channelPoint` path parameter is a `txid:index` outpoint before it goes into the URL.
  In passing, the Loop terms-and-quotes handlers assigned the same options object to both
  the min and max quote requests, so both fetched the max-amount quote; they now get their
  own. `test/backend/query-params.test.mjs` covers every handler.

- **First login failed with "Invalid CSRF token, form tempered" when entering at `/rtl/`**
  ([#1711](https://github.com/Ride-The-Lightning/RTL/pull/1711), fixes
  [#1710](https://github.com/Ride-The-Lightning/RTL/issues/1710)).
  The frontend takes its CSRF token from the `XSRF-TOKEN` cookie, which `server/utils/app.ts`
  mints only in the catch-all that serves `index.html` for deep links (`/rtl/login`,
  `/rtl/home`, …). `GET /rtl/` — what people type, and where `/rtl` redirects — was answered
  by `express.static` instead, mounted above the catch-all, so the page loaded with no token
  and the first login POST failed the CSRF check with 403; the error handler re-mints a token
  on that response, which is why the second attempt worked and why a refresh (now on
  `/rtl/login`) worked first time. The static handler was that way under `csurf` too, but
  since 0.15.10 tokens are signed with a per-boot secret, so every container restart brought
  the 403 back. `express.static` is now mounted with `index: false`, leaving the directory
  index to the catch-all like every other page, and any spelling that resolves to the index
  file (`/rtl/index.html`, repeated slashes, dot segments, percent-encoded bytes — anything
  `send`'s decode + normalize collapses to it) redirects to `/rtl/` with the query string
  preserved, so there is one entry path; that page is sent with `Cache-Control: no-store`
  since it carries a per-client token pair; `/rtl` still redirects to `/rtl/`, static
  assets are served as before, and the BTCPay SSO entry (`/rtl/api/authenticate/cookie`)
  already went through the catch-all and is unchanged. A tab left open across an RTL restart
  still fails its first login once (its token is void until the page reloads); that is
  accepted. `test/backend/csrf-landing-page.test.mjs` boots `rtl.js` outside development mode
  (where CSRF is off) and asserts the cookie arrives with `GET /rtl/`, that a login after it
  succeeds first time, that a login without a token is still refused, and that the redirect
  and static assets are intact.

## Code Health

- **More test coverage for the LND close-channel query parameters**
  ([#1721](https://github.com/Ride-The-Lightning/RTL/pull/1721); follow-up to #1713).
  `test/backend/query-params.test.mjs` checked a malformed `force` for `closeChannel` but not
  the other two parameters. It now also asserts that a malformed or repeated `target_conf`,
  `sat_per_vbyte` or `force` answers 400 with nothing sent to LND, and that only those three
  parameters are forwarded. Tests only; no code change.

- **Dependency update batch**
  ([#1727](https://github.com/Ride-The-Lightning/RTL/pull/1727)).
  Resolves the open Dependabot alerts in one pass, per the process in `CONTRIBUTING.md`. The
  Angular framework packages move from 20.3.27 to 20.3.33 (#1706, #1707, #1708, and the
  router advisory fixed in 20.3.32), and the CLI line (`@angular/cli`, `@angular/build`,
  `@angular-devkit/build-angular`) from 20.3.36 to 20.3.37. `axios`, the one runtime finding,
  moves from 1.18.1 to 1.20.0 for two prototype-pollution advisories. In the lockfile, `hono`
  moves to 4.13.12 (#1704), `js-yaml` to 4.3.2 (#1705) and `ip-address` to 10.7.2 (#1719),
  along with `undici`, `engine.io`, `fast-uri`, `brace-expansion`, and the `body-parser`,
  `express` 4 and `qs` copies under karma and webpack-dev-server. `npm audit --omit=dev` goes
  from 1 high to **0**; the full count goes from 26 (8 high, 18 moderate) to 6 (2 high,
  4 moderate), all in build tooling that never ships: `@angular-devkit/build-angular` 20.x and
  its `webpack-dev-server` / `webpack-dev-middleware` / `sockjs` / `uuid` chain, which only an
  Angular 22 migration moves. The lockfile was regenerated from scratch and the compiled
  artifacts rebuilt from it: `frontend/` changes with the Angular bump, `backend/` came out
  byte-identical.

## Developer Tooling

- **Docker fixture: Core Lightning bumped to v26.06.8**
  ([#1717](https://github.com/Ride-The-Lightning/RTL/pull/1717)).
  The `cln` service in `docker/docker-compose.yml` pinned `elementsproject/lightningd:v25.09`,
  a year behind what nodes run in the field. It now pins `v26.06.8`, the current release.
  Verified from a clean `docker compose down -v && up -d && scripts/seed.sh`: the seed produces
  the same channels and payments, the rune healthcheck still passes, and invoice creation
  through RTL's CLN API returns 201 with and without an expiry. No RTL code changes.
