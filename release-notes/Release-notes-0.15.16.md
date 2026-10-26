# Release Notes — 0.15.16

This document collects the changes that go into the 0.15.16 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Security

- **Session, CSRF and XSRF-TOKEN cookies are scoped to RTL's base path**
  ([#1785](https://github.com/Ride-The-Lightning/RTL/pull/1785)). All three cookies were
  issued with the site-wide default `Path=/`, although RTL serves itself under `/rtl`. Behind
  BTCPay Server and similar bundles RTL shares its origin with other applications on sibling
  paths, so the browser sent RTL's session cookie and signed CSRF cookie on every request to
  them, and the readable `XSRF-TOKEN` sat in their `document.cookie`. Each cookie now carries
  `Path=/rtl` (the `baseHref`), so none of them leaves RTL's own routes. A cookie path is not
  an origin boundary, so this is least privilege rather than isolation, and nothing about the
  login or the BTCPay single-sign-on entry changes. Reported by Gleb Lizunov (hokvo).

- **Docker image upgrades Alpine's packages at build time**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD), fixes
  [#1791](https://github.com/Ride-The-Lightning/RTL/issues/1791)). The `v0.15.15` image runs
  Node 22.23.4, which rejects the eMudhra chains, but still carried Alpine's
  `ca-certificates-bundle-20260909-r0`, so tools inside the container that use the system
  trust store (BusyBox `wget`, `openssl`) accepted 7 of the 14 affected test chains. RTL's
  own HTTPS calls were never affected: Node uses its bundled roots. The image was built from
  the `node:22-alpine` tag a few hours before that tag was refreshed with Alpine's corrected
  `ca-certificates-20261020-r0`, and the runner stage never upgraded the packages it
  inherited, so the trust store was frozen at whatever the base image had on build day. The
  runner stage now runs `apk upgrade --no-cache` after installing `tini`, so every build picks
  up Alpine's current package fixes regardless of when the base tag was last rebuilt.
  Reported by Nicolas Dorier.

## Dependencies

- **Dependency update batch** ([#1784](https://github.com/Ride-The-Lightning/RTL/pull/1784)):
  resolves every open Dependabot alert. `npm audit` goes from 17 findings (1 high in
  production scope) to 0 in both scopes.
  - **`body-parser` 2.4.0** (production, [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828)):
    the one production finding. body-parser 2.0.0–2.3.0 mishandled trailing bytes after a
    compressed request body, a denial-of-service vector. RTL parses bodies before
    authentication (the login route needs one), so anyone who can reach RTL's port could send
    such a body; the 25 MB body limit bounded the work. `qs` 6.16.1 and `content-type` 2.1.0
    move with it, all within `express` 5.2.1's ranges.
  - **Angular CLI 20.3.41** (`@angular/cli`, `@angular/build`,
    `@angular-devkit/build-angular`; supersedes Dependabot
    [#1783](https://github.com/Ride-The-Lightning/RTL/pull/1783)): brings
    `@modelcontextprotocol/sdk` 1.32.1
    ([GHSA-22jm-h49p-29qw](https://github.com/advisories/GHSA-22jm-h49p-29qw),
    [GHSA-rvq5-wwqv-78pq](https://github.com/advisories/GHSA-rvq5-wwqv-78pq),
    [GHSA-6prh-2h8m-c8cw](https://github.com/advisories/GHSA-6prh-2h8m-c8cw)) and `zod` 4.6.6.
    The MCP server inside the CLI never runs in RTL's build; build tooling only.
  - **`uuid` 11.1.1 under `sockjs`** via a scoped `overrides` entry
    ([GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)): `sockjs`
    (the `ng serve` live-reload transport) pins `uuid` ^8 and is unmaintained, so the fix
    cannot arrive through it. `sockjs` only calls `v4()` with no buffer, so the flaw was not
    reachable; the override clears the alert without touching how `sockjs` works. Angular 22
    ([#1732](https://github.com/Ride-The-Lightning/RTL/pull/1732)) would drop `sockjs`
    altogether and stays open as a migration.
  - **Transitive dev-tooling patches** picked up by regenerating the lockfile:
    `launch-editor` 2.14.2, `fast-uri` 3.1.9, `http-cache-semantics` 4.3.0, `ip-address` 10.7.4,
    `serialize-javascript` 7.1.4, `undici` 6.29.1, `webpack` 5.112.0.
  - The `follow-redirects` and `@angular/common` alerts GitHub still lists against `master`
    were fixed in v0.15.15 ([#1780](https://github.com/Ride-The-Lightning/RTL/pull/1780));
    they close once GitHub re-reads the lockfile.

  The Angular framework stays on 20.3.34 (latest 20.x). `backend/` is unchanged; `frontend/`
  is rebuilt with the new CLI.
