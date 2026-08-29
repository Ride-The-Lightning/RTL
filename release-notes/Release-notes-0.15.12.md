# Release Notes — 0.15.12

This document collects the changes that go into the 0.15.12 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **Eclair: invoices are paged instead of fetched whole**
  ([#1690](https://github.com/Ride-The-Lightning/RTL/pull/1690), fixes
  [#1067](https://github.com/Ride-The-Lightning/RTL/issues/1067)).
  Opening the Eclair dashboard or Transactions page asked the node for every invoice it had
  ever issued (`count=1000000`) and then called `/getreceivedinfo` once per invoice, all at
  once — on a node with hundreds of thousands of invoices that pinned Eclair at 100% CPU
  until the request timed out and RTL retried. Eclair's `listinvoices` has offered
  `count`/`skip` since 2022, but it returns oldest-first and never reports a total, and the
  request for one ([eclair#2855](https://github.com/ACINQ/eclair/issues/2855)) was closed,
  so the paging RTL had plumbed in #1393 stayed switched off. The backend now derives the
  total itself — a handful of single-row probes (gallop, then bisect: O(log n) calls that each
  cost Eclair one `LIMIT 1 OFFSET n` query) — and serves one newest-first page as
  `{ invoices, totalInvoices }`. The page size defaults to 10 and is capped at 100 whatever
  the client asks for, so the per-invoice status fan-out is bounded by the page; the separate
  unbounded `listpendinginvoices` call is gone, since `/getreceivedinfo` already reports
  `pending`. Malformed `count`/`skip` values are refused with a 400 rather than forwarded.
  The invoices table pages server-side with an exact total; sort and the filter box apply
  within the current page. The transactions report, which had summed received amounts from
  the full invoice list, now uses the audit's received payments, which the payments fetch
  already loads. Tested against Eclair 0.13.1 in the docker fixture; the fixture's Eclair
  is one minor behind the current release, tracked in
  [#1689](https://github.com/Ride-The-Lightning/RTL/issues/1689).

- **Login lockout never expired, and its counter table grew without bound**
  ([#1691](https://github.com/Ride-The-Lightning/RTL/pull/1691), part of
  [#1656](https://github.com/Ride-The-Lightning/RTL/issues/1656)).
  After five failed logins RTL locks the requesting address for 30 minutes — but the expiry
  check compared the clock against a freshly created entry rather than the stored one, so it
  never fired, and the periodic sweeper called `clearInterval` on itself the first time it
  deleted anything. An address that hit the limit stayed locked until the process restarted,
  even with the correct password: five bad attempts from an operator's address denied them
  their own node indefinitely. Counters were also kept in a plain object keyed by the client
  address, with no size bound and the usual `__proto__`/`constructor` key hazards. The stored
  entry is now what expiry is tested against, the sweeper keeps running, and counters live in
  a `Map` capped at 1000 addresses. Only a failed attempt takes a slot — lookups and
  successful logins store nothing — and when the table is full the least recently failed
  address that is *not* currently locked out is evicted, so churn from other addresses cannot
  flush a live lockout; only when every tracked address is locked does the oldest lockout go.
  A locked address also records nothing further: previously a wrong guess during the lockout
  pushed the "try again after" deadline forward while a correct one did not, which both let
  the window be extended indefinitely and told an unauthenticated caller whether their guess
  was right. In the same spirit, when 2FA is enforced the two failure replies no longer say
  which credential was wrong: the password is checked first, so a distinct "Invalid 2FA
  Token" reply confirmed a correct password to a caller who had no token. Both now read
  "Invalid Password or 2FA Token!" (the server log still records which); without 2FA the
  message is unchanged. Covered by backend tests in `test/backend/authenticate.test.mjs`,
  including the sweep pass, the eviction policy and the locked-state and 2FA responses. The third finding in #1656 — the counter keys on
  `X-Forwarded-For`, which a client can rotate to dodge the limit — needs a decision on
  trusted-proxy configuration and is left open.

- **Hardening: application-settings save can no longer re-point credentials or server URLs**
  ([#1683](https://github.com/Ride-The-Lightning/RTL/pull/1683), fixes
  [#1660](https://github.com/Ride-The-Lightning/RTL/issues/1660)).
  `updateApplicationSettings` merged the request body's per-node `authentication` and
  `settings` wholesale, so an authenticated caller could inject a `macaroonPath`, `runePath`,
  `lnApiPassword`, `configPath` or `lnServerUrl` and re-point credentialed requests or the
  `getConfig`/`getFile` file reads at attacker-controlled values — a confused-deputy vector.
  The endpoint now allowlists the node fields it accepts from the body (mirroring
  `updateNodeSettings`) and pins server URLs and credential paths — including the swap and
  Boltz macaroon paths, which reach outbound requests as auth headers — to the server-held
  values for existing nodes. A node whose index the server does not already know is dropped
  with a warning instead of being provisioned: there is no add-node flow through this
  endpoint, and a caller-chosen path or URL would otherwise be persisted to
  `RTL-Config.json` and loaded back into the runtime nodes at the next restart. Node indexes
  are normalized to numbers so a string-indexed payload merges into the existing node
  instead of duplicating it, and a live 2FA seed can no longer be overwritten by a
  request-supplied seed. Backend regression tests cover the allowlist, the unknown-node
  drop, the index normalization and the 2FA-seed guard. The `defaultNodeIndex` and
  `selectedNodeIndex` scalars are validated against the known node set like the node
  entries themselves, so an out-of-range value cannot be persisted and survive a restart.
  CLN's live rune (`authentication.runeValue`) is pinned for existing nodes and stripped
  for unknown nodes like every other credential. The Node Settings endpoint
  (Services page) continues to accept the Loop/Boltz server URLs and macaroon paths, which
  are intentionally editable features, but now runs them through the same `http(s)` format
  validation; a plaintext `multiPass` in the body is discarded, and a crafted channel value
  on the channel-backup file read is sanitized so it can no longer walk out of the backup
  directory.

## Enhancements

- **LND: open a channel with the entire wallet balance**
  ([#1682](https://github.com/Ride-The-Lightning/RTL/pull/1682), fixes
  [#155](https://github.com/Ride-The-Lightning/RTL/issues/155)).
  Emptying the on-chain wallet into a channel could not be done from the UI: the amount had
  to be entered by hand, and the balance itself is never a valid amount because nothing is
  left for the on-chain fee — or for the reserve LND holds back for anchor channels. The
  maximum can only be computed by the node, which is why this waited on
  [lnd#6903](https://github.com/lightningnetwork/lnd/pull/6903) (`fund_max` on
  `OpenChannelRequest`, LND 0.16.0). Both LND channel-open dialogs — the open-channel modal
  and the connect-peer stepper — now carry a "Use Entire Wallet Balance" toggle that
  disables the amount field and sends `fund_max` instead of `local_funding_amount`; LND
  rejects a request carrying both, so `postChannel` sends exactly one, matching the flag
  strictly — the API also accepts urlencoded bodies, where a client's `fund_max=false` arrives
  as a truthy string and must not commit the whole wallet. The flag is only sent
  when the toggle is on, and the toggle only appears on LND 0.16.0 and above, so nothing
  changes for older nodes. The toggle is disabled while nothing is spendable, which is
  narrower than the wallet balance in two ways: `total_balance` still counts the
  anchor-channel reserve, and it counts unconfirmed coins that `fund_max` will not draw on
  unless "Spend Unconfirmed Output" is on — either way the wallet looks funded while fund max
  would fail inside LND with a negative-amount error. `fund_max` itself is matched against explicit true and
  false spellings — a urlencoded body cannot carry a boolean, so the flag arrives as `'true'`,
  a checkbox's `'on'`, or a repeated field's array — and anything outside both lists, or a body
  carrying `local_funding_amount` as well, is refused with a 400 rather than resolved by branch
  order: every wrong guess misstates the amount by the whole on-chain wallet. Core Lightning already had the equivalent (`amount: "all"`);
  Eclair's `/open` has no fund-max option and is unchanged. Covered by backend tests
  (`test/backend/lnd-channels.test.mjs`) that pin which of the two fields reaches the node,
  and by component specs for the version gate and the dispatched payload.

## Code Health

- **Align route middleware across the API**
  ([#1688](https://github.com/Ride-The-Lightning/RTL/pull/1688)).
  `POST /api/ecl/channels/circularRebalance` and `GET /api/conf/updateSelNode/:curr/:prev`
  were the only two state-changing routes registered without the `isAuthenticated`
  middleware the rest of the API uses; both now carry it and answer 401 without a session
  token. The two block-explorer proxies under `/api/conf` (`explorerFeesRecommended`,
  `explorerTransaction/:txid`) are only ever called from logged-in dialogs and now carry it
  too. `test/backend/route-guards.test.mjs` mounts the real routers and exercises them over a
  socket, and also walks every route module under `server/routes/` asserting that everything
  outside the five routes the login page needs (`authenticate`, `conf`, `conf/rates`) has the
  guard as its first handler, and that the index routers mount nothing but the modules
  walked — so a future route added without the middleware fails the suite. The frontend used to call `updateSelNode` once before
  login, from the initial config fetch; there is no server-side session to switch at that
  point, and the login page only needs the node's name and theme, which the config response
  already carries, so that call is now resolved locally and the server is only asked once a
  token exists. The `XSRF-TOKEN` *response header* — set alongside the cookie for the
  RTL-Quickpay jQuery client, which has since been archived — is gone; the cookie the
  Angular frontend reads is unchanged.

## Developer Tooling

- **Declare a minimum Node.js version**
  ([#1681](https://github.com/Ride-The-Lightning/RTL/pull/1681), closes
  [#1220](https://github.com/Ride-The-Lightning/RTL/issues/1220)).
  `package.json` carried no `engines` field, so npm installed RTL on any Node.js version
  without a word, and an unsupported runtime only showed up later as a confusing failure at
  `node rtl` — as in #1220, where two users on Node 19.x/20.0.0 got `Cannot find module
  'request-promise'` from an install that had reported success, and both were fixed by
  dropping to Node 18.15. (The dependency behind that particular report is gone: #1638
  replaced `request`/`request-promise` with axios in 0.15.9.) `engines.node` is now
  `>=20.19.0`, the floor the Angular 20 toolchain requires, so npm prints an `EBADENGINE`
  warning at install time instead. The docs said `v14 & above` in `CONTRIBUTING.md` and gave
  no version at all in the README; both now state the same floor.
