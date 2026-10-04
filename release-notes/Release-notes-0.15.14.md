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

## Developer Tooling

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
