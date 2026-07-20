# Release Notes — 0.15.9

This document collects the changes that go into the 0.15.9 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **Multi-node: preserve per-node auth when saving application settings**
  ([#1645](https://github.com/Ride-The-Lightning/RTL/pull/1645), supersedes
  [#1598](https://github.com/Ride-The-Lightning/RTL/pull/1598)).
  When saving application settings on a multi-node setup, `addSecureData` matched each saved
  node against the in-memory config by **array position** (`appConfig.nodes[i]`), so once nodes
  were reordered or one was removed, another node's `macaroonPath`/`runePath` could be grafted
  onto the wrong node — corrupting its authentication. Matching is now keyed by `node.index`
  (via a lookup map) in both `addSecureData` and the config-write path, and the persisted
  `RTL-Config.json` is sanitized of runtime-only fields (the request `options` object and the
  resolved `runeValue`) so they are never written to disk. Contributed by @CosimoRicciardi in
  #1598; landed here rebased onto the release branch with a regression test
  (`test/backend/rtlconf.test.mjs`).

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

- **Reports: realign the Scroll Range select with the date picker**
  ([#1637](https://github.com/Ride-The-Lightning/RTL/pull/1637), fixes
  [#1635](https://github.com/Ride-The-Lightning/RTL/issues/1635)).
  The a11y fix in #1609 wrapped the Reports page's bare Scroll Range `mat-select` in a
  `mat-form-field` so it could carry a label, but the new wrapper reserved Material's
  hint/subscript space below the input (78.8px total vs the date field's 56px) and was
  top-anchored, leaving the Monthly/Yearly Date picker sitting ~11px lower than the select
  on every implementation's report screens. The field now uses `subscriptSizing="dynamic"`
  (no hints are used, so no space is reserved) and centers on the cross axis, restoring the
  aligned 56px control row from v0.15.8 while keeping the accessibility label. Verified by
  measuring the rendered layout headlessly against the regtest fixture: both fields now
  render at identical top/height.

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

- **LND: remove the deprecated `outgoing_chan_id` from QueryRoutes**
  ([#1591](https://github.com/Ride-The-Lightning/RTL/pull/1591)).
  LND deprecated the singular `outgoing_chan_id` query parameter on `QueryRoutes` as of
  v0.20.0 in favor of the plural `outgoing_chan_ids`. The code path was already unreachable
  in RTL — no caller of the `GetQueryRoutes` action ever populated `outgoingChanId`, so the
  parameter was never sent — so this drops the unused model field, the effect's conditional
  URL builder, and the server-side passthrough. The plural `outgoing_chan_ids` used by the
  send-payment and rebalance flows is unaffected.

- **LND: migrate `sat_per_byte` to `sat_per_vbyte` in node requests**
  ([#1592](https://github.com/Ride-The-Lightning/RTL/pull/1592)).
  LND's v0.21.0 release notes deprecate the `sat_per_byte` field, with removal planned in
  v0.22 across `CloseChannel`, `OpenChannel`, `SendCoins`, `SendMany` and
  `walletrpc.BumpFee`. LND already interprets the old field as sat/vbyte internally, so
  this is a pure wire-format rename with no value conversion. The close-channel,
  open-channel, send-coins and bump-fee request paths (and their matching TypeScript
  identifiers) now send `sat_per_vbyte`, keeping RTL compatible ahead of the removal.

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
  In-range fixes Dependabot hadn't re-opened PRs for (`pdfmake` 0.3.11 for its SSRF
  advisory, `qs`, `uuid`, `tough-cookie`, `cookie`, `ajv`, `bn.js`, `elliptic`) were
  picked up in the same pass. `npm audit` goes from 85 vulnerabilities (23 production)
  to 29 (13 production, none high or critical besides the `request` stack); everything
  remaining requires code changes, not version bumps — the deprecated
  `request`/`request-promise` stack, `csurf` and the `crypto-browserify` polyfill
  chain — and is tracked separately. Verified with a clean lint, the full frontend test suite, both production
  builds, and an end-to-end smoke test of the docker regtest fixture across LND, Core
  Lightning and Eclair (auth, getinfo, channel lists, and the WebSocket upgrade path).

- **Replace the deprecated `request`/`request-promise` HTTP stack with axios**
  ([#1638](https://github.com/Ride-The-Lightning/RTL/pull/1638), part of
  [#1634](https://github.com/Ride-The-Lightning/RTL/issues/1634)).
  `request` has been deprecated and unmaintained since 2020 and carries an unfixable SSRF
  advisory plus vulnerable pinned copies of `form-data` (critical), `qs`, `tough-cookie` and
  `uuid` — 8 of the 13 production `npm audit` findings left after #1633, none fixable by a
  version bump. All 36 backend files that imported `request-promise` (the LND, Core Lightning
  and Eclair controllers, Boltz/Loop/RTLConf shared controllers, `common.ts` and the LND
  websocket client) now go through a small compatibility wrapper (`server/utils/request.ts`)
  backed by `axios` — already a production dependency, so nothing new is added. The wrapper
  accepts the existing request-promise options (`qs`, `form` including pre-encoded string
  bodies, `body`, `baseUrl`/`uri`, `rejectUnauthorized`, `json`), resolves with the response
  body directly, and rejects with a plain object mirroring request-promise's
  `StatusCodeError`/`RequestError` shape, so `CommonService.handleError`'s status-code and
  message extraction (including the `ECONNREFUSED` → 503 mapping and Eclair's status-code
  special case) behaves as before; auth headers are omitted from rejected errors so they
  cannot leak into logs. Callers without `json: true` still receive the raw text body, and
  LND's line-delimited `/v2/router/send` stream still surfaces as a string for the existing
  parser. Production `npm audit` drops from 13 findings (2 critical) to 6 low, all in the
  `crypto-browserify`/`elliptic` polyfill chain tracked in #1634. Verified end-to-end against
  the docker regtest fixture: 43 API checks across all three implementations (reads, invoice
  creation, a routed LND payment over the streaming endpoint, cross-implementation payments
  from Core Lightning and Eclair, message sign/verify, channel backup to disk, bad-invoice
  and node-unreachable error mapping) plus a clean lint and both production builds.

- **Replace the deprecated `csurf` middleware with `csrf-csrf`**
  ([#1643](https://github.com/Ride-The-Lightning/RTL/pull/1643), part of
  [#1634](https://github.com/Ride-The-Lightning/RTL/issues/1634)).
  `csurf` has been deprecated since 2022 and pins an old `cookie` release with a known
  advisory; npm's only offered "fix" is a downgrade. It is now replaced by the maintained
  `csrf-csrf` (v4), which implements the same double-submit-cookie pattern with an
  HMAC-signed, session-bound token keyed on RTL's existing boot secret. The frontend
  contract is unchanged — the token still arrives in the `XSRF-TOKEN` cookie/header and is
  echoed back as `x-xsrf-token` (all header/body/query token sources csurf accepted are
  still accepted), the signed token cookie keeps the `_csrf` name (now httpOnly), and the
  `EBADCSRFTOKEN` error path in `app.ts` applies as before, so no Angular or Quickpay
  changes were needed. One behavioral fix this surfaced: `app.ts` called `req.csrfToken()`
  twice (cookie + header) — harmless under csurf, but token-desyncing under csrf-csrf —
  and now generates the token once per request. Tokens are also now bound to the session,
  so a token stolen from one session no longer validates in another — a check csurf's
  cookie mode didn't perform (and the websocket upgrade check in `authCheck.ts` keeps its
  previous semantics). Production `npm audit` drops from 6 low findings to 4, all in the
  `crypto-browserify`/`elliptic` chain tracked in #1634. Verified against the docker
  regtest fixture: both API suites (43 checks across LND, Core Lightning and Eclair) plus
  a dedicated CSRF battery — valid-token auth, missing/garbage token → 403,
  cross-session token replay → 403, token stability, the `XSRF-TOKEN` response header for
  Quickpay, and the websocket handshake.
  **Note for third-party scripts / API consumers**: because tokens are session-bound, the
  session cookie (`connect.sid`) must now be carried alongside the `_csrf` cookie and the
  token header — a token without its session no longer validates. Handshake against `GET /`
  (or any non-static route): static-served paths such as `/rtl/` do not mint CSRF cookies.
  If a token goes stale (destroyed or expired session, or an RTL restart), the 403 response
  re-mints fresh `XSRF-TOKEN`/`_csrf` cookies, so retrying with the new token succeeds.

- **Drop the `crypto-browserify` polyfill chain by moving 2FA TOTP to WebCrypto**
  ([#1644](https://github.com/Ride-The-Lightning/RTL/pull/1644), closes
  [#1634](https://github.com/Ride-The-Lightning/RTL/issues/1634)).
  The frontend build pulled in the browser polyfills `crypto-browserify`, `stream-browserify`
  and `vm-browserify` (mapped in via `tsconfig.json` `paths`) solely because `otplib`'s
  `@otplib/plugin-crypto` requires Node's `crypto`. That chain carried the last remaining
  production `npm audit` findings — the `elliptic` advisory (GHSA-848j-6mx2-7j84, no fixed
  release) plus `browserify-sign`/`create-ecdh`. The two-factor-auth settings dialog — the only
  browser consumer of `otplib` — now uses a small WebCrypto-based TOTP service
  (`src/app/shared/services/totp.service.ts`, RFC 6238: HMAC-SHA1, 6 digits, 30s step) instead,
  so `otplib` is no longer bundled and the three polyfills and their `tsconfig` path mappings are
  removed. The backend still verifies login tokens with `otplib`, and the new service is a
  byte-for-byte match for it (verified against otplib and the RFC 6238 test vectors), so existing
  authenticator enrollments keep working unchanged. `token.check()` becomes async (WebCrypto's
  digest API is promise-based); the dialog's verify handler was updated accordingly. **Production
  `npm audit` now reports zero vulnerabilities** (down from 13, incl. 2 critical, at the start of
  this dependency-cleanup series). Verified against the docker regtest fixture: enrolling a 2FA
  secret generated by the new service, confirming the backend's `otplib` accepts a token it
  produces at login, and rejecting wrong/absent tokens — plus a unit spec covering the RFC 6238
  vectors, `keyuri` parity, and base32 round-tripping, both API suites, and the full frontend
  spec suite (204 specs).

- **Rebuild the compiled CLN channels controller to match its source**
  ([#1631](https://github.com/Ride-The-Lightning/RTL/pull/1631)).
  The #1606 fix updated `server/controllers/cln/channels.ts` to mirror `peer_connected` onto the
  legacy `connected` field, but the committed compiled artifact
  `backend/controllers/cln/channels.js` was never regenerated, so it lagged its source. Rebuilt it
  so the committed backend output includes the connected-mirror line.

## Developer Tooling

- **Link the release notes from the README for discoverability**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD)).
  The `release-notes/` folder was not referenced anywhere — no README link, workflow, or
  script — so it was effectively undiscoverable. The README's intro navigation now links to
  it (`[Release Notes](../release-notes)`, alongside the existing docs links), so the
  per-release notes are reachable from the repo homepage. The folder stays at the repo root
  (release history is content, not `.github/` repo-meta).

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
