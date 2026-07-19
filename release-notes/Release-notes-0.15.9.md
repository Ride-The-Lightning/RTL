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

- **Accessibility: add missing form-field labels and remove positive tab indexes**
  ([#1609](https://github.com/Ride-The-Lightning/RTL/pull/1609), fixes
  [#1566](https://github.com/Ride-The-Lightning/RTL/issues/1566)).
  Several `mat-select` and datepicker controls across the send, invoice, open/close-channel,
  bump-fee, public-key and settings forms were rendered without a `mat-label`, so screen readers
  had no way to announce their purpose (WCAG 1.3.1 / 3.3.2). Descriptive labels were added to
  the affected controls. The forms also relied on positive `tabindex` values, an anti-pattern
  (WCAG 2.4.3) that produced an inconsistent keyboard order; these were removed so focus follows
  natural DOM order across the LND, Core Lightning, Eclair and shared modals.

- **Bound peer/route alias resolution to stop clnrest "Resource temporarily unavailable" errors**
  ([#1629](https://github.com/Ride-The-Lightning/RTL/pull/1629),
  fixes [#1501](https://github.com/Ride-The-Lightning/RTL/issues/1501)).
  RTL resolves peer aliases by calling `listnodes` (CLN) / `graph/node` (LND) once per peer. A
  prior fix bounded this to 20 concurrent calls (plus a cache) for the CLN channel list, but the
  Core Lightning **peers list** and **route lookup** — and the LND **peers list** — still fired an
  unbounded `Promise.all`, one request per peer at once. On Core Lightning nodes with many peers
  this overwhelms clnrest and fails with `Resource temporarily unavailable (os error 11)`
  (`EAGAIN`), leaving raw node IDs instead of aliases. All of these paths now use the same 20-way
  concurrency limit (Eclair already resolves aliases inline from a bulk nodes list, so it is
  unaffected). The CLN alias lookup was also made self-contained so aliases resolve regardless of
  which screen is opened first; the limiter now resolves immediately for an empty or non-positive
  input (which would previously never send a response); and the CLN alias cache gained a 6-hour TTL
  and a max size so aliases refresh without an RTL restart and the cache can't grow unbounded.

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

## Code Health

- **Batch dependency update resolving all 20 open Dependabot security PRs**
  ([#1633](https://github.com/Ride-The-Lightning/RTL/pull/1633)).
  Dependabot had 20 open security-alert PRs against `master` (#1583–#1617). Rather than
  merging them piecemeal (they conflict with each other on `package-lock.json` and target
  the wrong branch for the release flow), the same bumps were applied in one pass on the
  release branch: `axios` 1.16.0 and `ws` 8.21.0 (direct), the socket.io server stack
  (`engine.io`, `engine.io-client`, `socket.io-adapter`, `socket.io-parser`), express's
  `path-to-regexp`, `follow-redirects`, `lodash`, and the rest of the flagged transitive
  deps; the Angular framework packages moved in lockstep to 20.3.26 and the CLI/build
  toolchain to 20.3.32 (which drops the vulnerable `node-forge` from the tree entirely).
  In-range fixes Dependabot hadn't re-opened PRs for (`qs`, `uuid`, `tough-cookie`,
  `cookie`, `ajv`, `bn.js`, `elliptic`) were picked up in the same pass. `npm audit` goes
  from 85 vulnerabilities (23 production) to 30 (14 production); everything remaining
  requires code changes, not version bumps — the deprecated `request`/`request-promise`
  stack, `csurf`, `pdfmake` and the `crypto-browserify` polyfill chain — and is tracked
  separately. Verified with a clean lint, the full frontend test suite, both production
  builds, and an end-to-end smoke test of the docker regtest fixture across LND, Core
  Lightning and Eclair (auth, getinfo, channel lists, and the WebSocket upgrade path).

- **Rebuild the compiled CLN channels controller to match its source**
  ([#1631](https://github.com/Ride-The-Lightning/RTL/pull/1631)).
  The #1606 fix updated `server/controllers/cln/channels.ts` to mirror `peer_connected` onto the
  legacy `connected` field, but the committed compiled artifact
  `backend/controllers/cln/channels.js` was never regenerated, so it lagged its source. Rebuilt it
  so the committed backend output includes the connected-mirror line.

## Developer Tooling

- **Documented the Dependabot / dependency-update process in CONTRIBUTING.md**
  ([#1636](https://github.com/Ride-The-Lightning/RTL/pull/1636)).
  Dependabot's security PRs target `master` and are never merged individually — they are
  resolved in batch dependency-update PRs against the current release branch (as done in
  #1633). That process was previously undocumented. CONTRIBUTING.md now has a "Handling
  Dependabot PRs" section covering the full flow: collecting targets (including in-range
  fixes hidden by exact pins), applying bumps with Angular in lockstep, regenerating the
  lockfile from scratch, rebuilding and committing the compiled artifacts, verification,
  and tracking deprecated packages that need code-level replacement in dedicated issues.

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

- **Added an Eclair node to the regtest docker fixture**
  ([#1632](https://github.com/Ride-The-Lightning/RTL/pull/1632)).
  The `docker/` fixture now runs an `eclair` node alongside the LND and Core Lightning nodes,
  completing backend coverage of all three implementations RTL supports. RTL talks to its HTTP
  API with basic auth (`lnApiPassword`), and the seed opens an `eclair→bob` channel plus
  payments and an open invoice so RTL's Eclair screens have data. Polar's multi-arch
  `polarlightning/eclair` image is used because the official `acinq/eclair` image is amd64-only
  and its versioned tags are years stale. Since Eclair drives a bitcoind wallet rather than its
  own, an init container creates a dedicated `eclair` wallet before the node starts — otherwise
  it would attach to the fixture's mining wallet. A `bin/e-cli` helper wraps `eclair-cli`.
