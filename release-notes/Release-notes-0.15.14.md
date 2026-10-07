# Release Notes — 0.15.14

This document collects the changes that go into the 0.15.14 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Compatibility

- **Eclair 0.14 needs RTL 0.15.14.** RTL 0.15.13 and earlier cannot read Eclair 0.14's payment
  history: the Payments, Forwarding History and Reports pages fail. Upgrade RTL before or
  together with Eclair. RTL 0.15.14 still supports Eclair 0.13 and earlier
  ([#1739](https://github.com/Ride-The-Lightning/RTL/pull/1739)). Eclair 0.14 itself stops
  showing payments made before its upgrade (it moves them to `_before_v14` tables).

## Bug Fixes

- **Eclair 0.14: payment history, routing fees and forwarding history work again**
  ([#1739](https://github.com/Ride-The-Lightning/RTL/pull/1739), closes
  [#1735](https://github.com/Ride-The-Lightning/RTL/issues/1735)).
  Eclair 0.14 reworked its audit database and changed the shape of every `/audit` entry: sent
  parts report `amountWithFees`/`fees`/`channelId`/`settledAt`, received parts
  `channelId`/`receivedAt`, and a channel relay lists `incoming`/`outgoing` parts instead of
  `amountIn`/`amountOut`/`fromChannelId`/`toChannelId`. RTL read the 0.13 fields, so the
  Eclair payments, forwarding history and reports pages failed (`/api/ecl/fees/payments`
  returned 500 on `part.timestamp.unix`) and routing fees summed to `NaN`. The backend now fills
  RTL's existing fields in from either version (`server/controllers/eclair/fees.ts`); a 0.14
  sent part's `amount` is `amountWithFees − fees`, since 0.13's excluded the fees. The unused
  `/api/ecl/channels/stats` route, which called Eclair's removed `/channelstats`, is gone.
  Note: Eclair 0.14 moves audit rows written before the upgrade to `_before_v14` tables, so
  payments made before upgrading no longer appear in RTL. `test/backend/eclair-audit.test.mjs`
  covers both versions.

- **A tab left on one node no longer sends its requests to another node**
  ([#1743](https://github.com/Ride-The-Lightning/RTL/pull/1743), fixes
  [#1742](https://github.com/Ride-The-Lightning/RTL/issues/1742)).
  The selected node is stored on the server session, which every tab of a browser shares, while
  each tab reads it only at page load. After switching to an LND node in one tab, a tab still
  showing Core Lightning had its requests built from the LND node's settings: creating an
  invoice called LND's REST URL and failed with "Not Found". The backend now refuses an
  `/api/lnd`, `/api/cln` or `/api/ecl` request that doesn't match the session node's
  implementation with a 409 (after authentication, so a logged-out caller still gets 401). The
  error names the selected node and asks the user to reload the tab, instead of "Not Found".
  `test/backend/node-implementation-guard.test.mjs` replays the two-tab sequence.

- **LND: one node's failed channel backup no longer breaks another node or wipes its own backup**
  ([#1745](https://github.com/Ride-The-Lightning/RTL/pull/1745)).
  Every LND getinfo refreshes `channel-all.bak` for every configured LND node, not only the
  selected one. When a node's backup call failed (node down, LND error), RTL overwrote that
  node's stored `channel-all.bak` with an empty file, losing the last good backup just when the
  node was in trouble. And when any node's `admin.macaroon` could not be read, the unguarded
  read threw out of getinfo, so the dashboard failed with a 400 for whichever healthy node was
  selected. `getAllNodeAllChannelBackup` (`server/utils/common.ts`) now logs and skips a node
  whose macaroon cannot be read, leaves the stored file alone when the backup call fails or
  returns nothing, and writes a new backup to a temp file renamed over the old one, so a failed
  write cannot truncate it either. Each write gets its own temp file, since overlapping getinfo
  calls refresh the same node at once. `test/backend/lnd-getinfo-backup.test.mjs` covers the
  unreadable macaroon, a failing backup call, an empty response and overlapping refreshes.

- **An expired session sends you back to login instead of failing with an empty 400**
  ([#1746](https://github.com/Ride-The-Lightning/RTL/pull/1746)).
  The login token can outlive its server session (the cookie was dropped, or the session expired
  while the token survived). Such a request reaches the handlers with no selected node, and
  `updateSelectedNodeOptions` (`server/utils/common.ts`) put an empty `{}` node on the session,
  then read `.authentication.options` from it outside its `try`. The TypeError came back as
  400 `{}` from LND, Core Lightning and Eclair getinfo and from LND's `updateSelNodeOptions`,
  and the `{}` stayed on the session, so later requests failed the same way. The intended 401
  ("Session expired"), which makes the UI log out and return to the login page, was never sent.
  The helper now reports the missing node as an expired session without touching the session,
  so these requests answer 401. `test/backend/session-without-node.test.mjs` covers the four
  handlers, each twice in a row on the same session.

## Enhancements

- **CLN: show sweep countdown and close status for closing channels**
  ([#1734](https://github.com/Ride-The-Lightning/RTL/pull/1734), closes
  [#1733](https://github.com/Ride-The-Lightning/RTL/issues/1733)).
  A force-closed Core Lightning channel used to read `ONCHAIN` in Pending/Inactive Channels for
  the whole CSV delay, with no hint of when its funds return to the wallet. The State column now
  shows "Sweep in N blocks" while `onchaind` is waiting out the timelock, and Channel Information
  shows who closed the channel, the close transaction (copy and explorer link), the channel's
  status messages (latest first) and, under Show Advanced, its state-change history. All of it
  comes from fields `listpeerchannels` already returns, so there is no backend change. The
  countdown is read from the latest status message rather than derived from
  `their_to_self_delay`, which is the delay we impose on the peer, not the one we wait out. The
  close transaction is taken from `scratch_txid` and hidden when the peer broadcast the close,
  because `scratch_txid` is then our own unbroadcast commitment. The dialog body now scrolls, so
  the longer content stays reachable on short screens.

## Code Health

- **Dev tooling: patched `piscina` and `webpack-dev-middleware` under Angular 20**
  ([#1740](https://github.com/Ride-The-Lightning/RTL/pull/1740); Dependabot alerts #411, #410).
  `@angular-devkit/build-angular` and `@angular/build` 20.3.37, the newest 20.x, pin
  `piscina` 5.2.0 (critical: prototype-pollution gadget allowing RCE through worker options) and
  `webpack-dev-middleware` 7.4.2 (high: path traversal in the dev server). Both are build/dev-server
  only and not shipped. `package.json` `overrides` now pin them to 5.3.2 and 7.4.6, same major,
  so the full `npm audit` drops from 3 criticals to 0; production stays at 0, and `frontend/` is
  byte-identical. Dependabot's own fixes (#1731, #1732) jump to Angular 21/22 and stay open for
  that migration. Alerts #274 (`uuid` under `sockjs`, which only calls `v4()` without a buffer)
  and #413 (`http-cache-semantics` under the Angular CLI, no patched release) were dismissed with
  reasons.

## Developer Tooling

- **CI: fail when the committed `backend/` doesn't match `server/`**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD)).
  RTL runs the committed `backend/`, but the backend tests, the Docker image and CI all compile
  `server/` afresh, so a PR that forgets to commit the regenerated output passes everything.
  [#1745](https://github.com/Ride-The-Lightning/RTL/pull/1745) merged that way, and its compiled
  output arrived later in [#1746](https://github.com/Ride-The-Lightning/RTL/pull/1746). The
  `checks.yml` Test job now deletes `backend/`, runs `npm run buildbackend`, and fails if
  `git status` shows any change under it: a stale compiled file, a new `server/` file whose
  output was never added, or a removed one whose output was left behind. `frontend/` is not
  covered yet.

- **Docker fixture: Eclair 0.14.2 and Bitcoin Core 31.1, built from official releases**
  ([#1736](https://github.com/Ride-The-Lightning/RTL/pull/1736), closes
  [#1689](https://github.com/Ride-The-Lightning/RTL/issues/1689)).
  The fixture ran Eclair 0.13.1 and bitcoind 30.0 because Polar, whose multi-arch images it
  used, has published nothing newer, and `acinq/eclair` is amd64-only. Eclair 0.14.1+ also
  needs Bitcoin Core 31. Both images are now built locally (`docker/eclair/`,
  `docker/bitcoind/`) from the projects' release artifacts, each checked against a pinned
  SHA-256 taken from the signed checksum file. Eclair is pinned to 0.14.2 because 0.14.3's
  checksums are signed with a different key from the one ACINQ documents. Upgrading the
  fixture surfaced a real Eclair 0.14 incompatibility in RTL, tracked in
  [#1735](https://github.com/Ride-The-Lightning/RTL/issues/1735).

- **Docker fixture: deterministic seed and peers that survive `down`/`up`**
  ([#1738](https://github.com/Ride-The-Lightning/RTL/pull/1738), closes
  [#1737](https://github.com/Ride-The-Lightning/RTL/issues/1737)).
  `seed.sh` waited only until alice's graph contained the channels, so its first routed
  payments could fail before the routing policies arrived (3 of 5 on one run); it now waits
  until `queryroutes` finds a route. And after `docker compose down` / `up` Docker reshuffled
  container addresses while the nodes remembered their peers by IP, leaving channels inactive;
  the Lightning nodes now have fixed addresses on the compose network.
