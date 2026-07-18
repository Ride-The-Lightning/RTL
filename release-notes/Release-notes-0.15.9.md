# Release Notes — 0.15.9

This document collects the changes that go into the 0.15.9 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **All implementations: fix a page-load error when a channel's alias is undefined**
  ([#1581](https://github.com/Ride-The-Lightning/RTL/pull/1581)).
  On the home dashboard, channel labels were rendered as `(channel.alias || channel.peer_id).length`
  (and the `remote_alias`/`shortChannelId` variants). When both the alias and its fallback id were
  undefined, calling `.length` on `undefined` threw during change detection and errored the page on
  load. The bindings now fall back to an empty string (`|| ''`, with optional chaining) so a missing
  alias can no longer break the page.

- **Multi-node: fix stale auth options blocking a node whose credentials weren't ready at startup**
  ([#1601](https://github.com/Ride-The-Lightning/RTL/pull/1601)).
  `CommonService.setOptions` short-circuited on `this.nodes[0]` regardless of which node was being
  processed, so once the first node's auth headers loaded, every subsequent call returned early. A
  second node whose credential load had failed — e.g. a Core Lightning rune file written
  asynchronously after RTL starts — was never retried and kept failing with `missing rune!` until
  RTL was restarted. The cache check is now per-node, so a node that failed to initialize is retried
  on the next request once its credential is available, while already-loaded nodes are still skipped.

- **Core Lightning: fix contradictory channel connection status between the list and the
  detail panel** ([#1625](https://github.com/Ride-The-Lightning/RTL/pull/1625), fixes
  [#1606](https://github.com/Ride-The-Lightning/RTL/issues/1606)).
  CLN's `listpeerchannels` reports connection state as `peer_connected`, but the open and
  pending channel-list columns read the legacy `connected` field, which the backend never
  populated. The list therefore always rendered "Disconnected" while the detail panel (which
  reads `peer_connected`) showed the true state. The backend now normalizes
  `connected = peer_connected` in the `listPeerChannels` response so legacy consumers stay in
  sync, and the list columns read `peer_connected` directly. Regression tests were added for
  both channel tables.

- **Core Lightning: fix the channel View Info modal rendering blank for disconnected channels**
  ([#1625](https://github.com/Ride-The-Lightning/RTL/pull/1625), fixes
  [#1606](https://github.com/Ride-The-Lightning/RTL/issues/1606)).
  The channel information modal renders a block-explorer link from `selNode.settings.blockExplorerUrl`,
  but the pending/inactive channels table opened the modal without passing `selNode`. With it
  undefined, that binding threw during change detection and blanked every field below it — State,
  Connected, Private and the balances all showed no value. Because a disconnected channel moves to
  the pending/inactive table, this is exactly what was seen on "View Info" for a disconnected
  channel. The pending table now passes `selNode` (matching the open table), and the modal guards
  the explorer link so a missing `selNode` can no longer blank the dialog. The LND channel
  information modal had the same unguarded `selNode.settings.blockExplorerUrl` binding (reachable
  from the active-HTLCs and channel-backup tables, which open it without `selNode`), so the same
  guard was applied there for parity. Eclair's modal doesn't use `selNode.settings`, so it is
  unaffected.

- **All implementations: restore the "items per page" dropdown (and first/last-page buttons)
  on paginated tables** ([#1626](https://github.com/Ride-The-Lightning/RTL/pull/1626), fixes
  [#1580](https://github.com/Ride-The-Lightning/RTL/issues/1580)).
  A dependency-update commit in the 0.15.8-beta cycle mechanically renamed the paginator
  binding `[showFirstLastButtons]` to `[hidePageSize]` on every `mat-paginator` while keeping
  the same `screenSize === XS ? false : true` expression. Because the two properties have
  opposite polarity, this inverted the behavior: on desktop the page-size selector was hidden,
  so users were locked to 10 items per page with no way to raise it — and the first/last-page
  buttons were dropped everywhere as collateral. Reverting the ~44 affected paginators back to
  `[showFirstLastButtons]` restores both behaviors across the LND, Core Lightning, Eclair and
  shared tables.

## Enhancements

- **Add a Disable Authentication option**
  ([#1582](https://github.com/Ride-The-Lightning/RTL/pull/1582)).
  A new `disableAuth` config flag (or `DISABLE_AUTH` environment variable) lets RTL run without its
  login screen — intended for node-platform vendors who put their own authentication layer in front
  of RTL, not for standalone users. When enabled, RTL issues a session token automatically and
  disables password updates and 2FA; a configured `APP_PASSWORD` is rejected as incompatible.
  Backend, frontend, and configuration docs were updated.

- **LND: show "Blocks till Maturity" by default on the Pending Force Closing list**
  ([#1627](https://github.com/Ride-The-Lightning/RTL/pull/1627), fixes
  [#1567](https://github.com/Ride-The-Lightning/RTL/issues/1567)).
  Blocks-till-maturity is critical for a force-closing channel, but it was only visible in the
  per-channel detail modal. The column and its data binding already existed in the table (and
  was selectable via column settings); it was simply absent from the default column selection.
  Added `blocks_til_maturity` to the `pending_force_closing` defaults for both the desktop and
  mobile (SM) layouts, so it's surfaced on the list out of the box. Users who have already
  customized this page keep their saved columns and can add it via the column-settings gear.

## Developer Tooling

- **Rebuilt the regtest docker fixture**
  ([#1621](https://github.com/Ride-The-Lightning/RTL/pull/1621)).
  The `docker/` dev setup had been unable to start since February 2021 — a broken `boltz` service
  (undeclared `BOLTZ_*` variables, a non-existent build context, and undeclared volumes) made
  Compose reject the whole project, so even `docker compose up -d bitcoind` failed. It was replaced
  with a working regtest network: `bitcoind` 30.0 + three LND 0.20.0-beta nodes
  (alice → bob → carol, so RTL's routing/forwarding screens have data) + RTL, all using Polar's
  multi-arch images (nothing built locally; works on arm64), plus a deterministic `seed.sh`. The
  Core Lightning node below was later added on top of this fixture.

- **Added a Core Lightning node to the regtest docker fixture**
  ([#1625](https://github.com/Ride-The-Lightning/RTL/pull/1625)).
  The `docker/` fixture now runs a `cln` node (official `elementsproject/lightningd` image)
  alongside the three LND nodes, wired to RTL over clnrest with rune auth, and the seed opens
  a `cln→alice` channel. This gives RTL's Core Lightning screens a real backend for local
  development and testing — it was used to verify the CLN channel-connection fix above
  end-to-end. See `docker/README.md`.
