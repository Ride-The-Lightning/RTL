# Release Notes — 0.15.11

This document collects the changes that go into the 0.15.11 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **LND: peer alias lookups could use another node's URL and macaroon**
  ([#1668](https://github.com/Ride-The-Lightning/RTL/pull/1668), fixes
  [#1662](https://github.com/Ride-The-Lightning/RTL/issues/1662)).
  `getAliasForPeers` read the module-level `options` object inside the limiter-deferred alias
  tasks in `server/controllers/lnd/peers.ts`, and `postPeer` mutated it again after the connect
  round trip. Because every handler reassigns that object on entry, a request for a different
  node arriving in that window (a second tab, or a multi-node switch) made node A's alias
  lookups — and `postPeer`'s follow-up peer list — go out with node B's URL or macaroon,
  yielding truncated aliases or a failed connect. This was the one alias fan-out #1651 did
  not cover; CLN and Eclair are structurally unaffected. Both handlers now snapshot their
  request options before any async boundary and hand each alias task its own copy, and
  `getAliasForPeers` derives its request from the options it is given rather than module
  state. Two backend regression tests (`test/backend/lnd-peers.test.mjs`) reproduce the race
  against fake LND nodes and fail on the pre-fix code.

- **Hardening: application-settings save can no longer re-point credentials or server URLs**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD), fixes
  [#1660](https://github.com/Ride-The-Lightning/RTL/issues/1660)).
  `updateApplicationSettings` merged the request body's per-node `authentication` and
  `settings` wholesale, so an authenticated caller could inject a `macaroonPath`, `runePath`,
  `lnApiPassword`, `configPath` or `lnServerUrl` and re-point credentialed requests or the
  `getConfig`/`getFile` file reads at attacker-controlled values — a confused-deputy vector.
  The endpoint now allowlists the node fields it accepts from the body (mirroring
  `updateNodeSettings`), pins server URLs and credential paths to the server-held values for
  existing nodes, strips credential paths from any node the server does not already know,
  and rejects a malformed `lnServerUrl` on such a node. Node indexes are normalized to
  numbers so a string-indexed payload merges into the existing node instead of duplicating
  it, and a live 2FA seed can no longer be overwritten by a request-supplied seed. Backend
  regression tests cover the allowlist, the index normalization and the 2FA-seed guard.

## Enhancements

- **2FA login: password managers can offer the one-time code**
  ([#1673](https://github.com/Ride-The-Lightning/RTL/pull/1673), fixes
  [#1674](https://github.com/Ride-The-Lightning/RTL/issues/1674)).
  The token input in the two-factor login dialog had no `autocomplete` attribute, and its
  `id`, `name` and label were all `token`. A password manager had no data to find the
  field. Bitwarden, for example, accepts a field only if the field has
  `autocomplete="one-time-code"`, or if it contains a word from the `TotpFieldNames` list,
  which does not include `token`. RTL also makes this dialog only after you send the
  password, so the field is not in the page during the first autofill operation. Users
  typed each code by hand. The input now has `autocomplete="one-time-code"`, the standard
  value for this field, which password managers and browsers read directly. The change is
  in the frontend only, and the token check does not change. A new test in
  `login-2fa-token.component.spec.ts` guards the attribute.

## Code Health

- **Add a security policy (`SECURITY.md`) and private reporting channels**
  ([#1677](https://github.com/Ride-The-Lightning/RTL/pull/1677)).
  RTL had no `SECURITY.md`, GitHub private vulnerability reporting was disabled, and the only
  contact path in the repo was a Twitter DM — so a researcher holding an RTL vulnerability had
  no private way to report it short of a DM or a public issue. A `SECURITY.md` at the repo root
  now names two private channels (GitHub private vulnerability reporting, and a security email
  with a `[RTL-SEC]` subject prefix), the RTL release-signing PGP fingerprint for encrypted
  reports, a no-attachments / no-bounty policy, an RTL-specific scope (in: auth and session
  bypass, CSRF, credential exposure, config-file handling, traversal/XSS; out: `disableAuth`
  deployments, plain HTTP behind a proxy, the intentionally-committed `docker/` fixture
  credentials), a latest-release-only support statement, and a 72-hour acknowledgement
  target. The README gains a Security section and its contact line now routes security
  reports there instead of to Twitter.

- **Batch dependency update resolving the open Dependabot security PRs**
  ([#1676](https://github.com/Ride-The-Lightning/RTL/pull/1676)).
  Dependabot had seven open security PRs against `master` (#1663, #1666, #1667, #1670,
  #1671, #1672, #1675), all against build tooling. Rather than merging them piecemeal (they
  conflict with each other on `package-lock.json` and target the wrong branch for the release
  flow), the fixes were applied in one pass on the release branch. The Angular CLI line moved
  20.3.32 → 20.3.34 (`@angular/cli`, `@angular/build`, `@angular-devkit/build-angular`), which
  brought `postcss` 8.5.23, `hono` 4.13.2 and `@hono/node-server` 2.1.1 with it; the lockfile
  was regenerated from scratch and the remaining flagged transitives moved to their fixed
  in-range versions (`js-yaml` 4.3.1, `undici` 6.28.0, `fast-uri` 3.1.5, `ip-address` 10.5.0,
  `nanoid` 3.3.18, `brace-expansion`). `npm audit` went 15 → 6 (all remaining are dev-only:
  `less`/`image-size` and `webpack-dev-server`/`sockjs`/`uuid`, pinned exactly by
  `@angular-devkit/build-angular` 20.x and only fixable by a major Angular CLI bump);
  production dependencies were at 0 before and after, and no runtime dependency changed
  version. #1650 (Angular CLI 21) stays open — it is a framework migration, not a bump.
