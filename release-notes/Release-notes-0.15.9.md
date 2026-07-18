# Release Notes — 0.15.9

This document collects the changes that go into the 0.15.9 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

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

- **Added a Core Lightning node to the regtest docker fixture**
  ([#1625](https://github.com/Ride-The-Lightning/RTL/pull/1625)).
  The `docker/` fixture now runs a `cln` node (official `elementsproject/lightningd` image)
  alongside the three LND nodes, wired to RTL over clnrest with rune auth, and the seed opens
  a `cln→alice` channel. This gives RTL's Core Lightning screens a real backend for local
  development and testing — it was used to verify the CLN channel-connection fix above
  end-to-end. See `docker/README.md`.
