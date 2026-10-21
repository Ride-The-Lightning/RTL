# Release Notes — 0.15.15

This document collects the changes that go into the 0.15.15 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Security

- **Node.js 22.23.4 / 24.22.1: the Docker image and the supported Node range move to the
  October 2026 Node.js security releases**
  ([#1780](https://github.com/Ride-The-Lightning/RTL/pull/1780)).
  Node.js published ten CVEs on 2026-10-21
  ([advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)). The one
  that reaches RTL as deployed is CVE-2026-111497, an out-of-bounds write in Node's bundled
  Brotli decoder: RTL's request-body parser and its HTTP client both accept Brotli-encoded
  content, so the decoder runs on data from the network. The same releases also carry the
  `eMudhra` intermediate-CA compromise fix (a blocklist of the leaked intermediate keys and the
  removal of the emSign roots), which matters only for RTL's fiat-rate and fee-estimate calls
  since node connections use the node's own certificate. No RTL code changes; the fix is the
  runtime. `Dockerfile` builds on `node:22-alpine`, so the v0.15.15 image is built on Node
  22.23.4. For bare-metal installs, `engines.node` in `package.json`, the README and
  `CONTRIBUTING.md` now state Node 22.23.4 or 24.22.1 and above; Node 20 is end of life and
  does not receive the fix, so `checks.yml` no longer tests on it.
- **`follow-redirects` 1.16.1** (Dependabot [#1778](https://github.com/Ride-The-Lightning/RTL/pull/1778),
  [GHSA-q3jh-wrc6-jgq8](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8),
  [GHSA-8r9p-f939-6h3c](https://github.com/advisories/GHSA-8r9p-f939-6h3c)). Used by `axios` for
  redirects; 1.16.0 could keep credential headers on a cross-origin redirect. RTL's outbound
  calls go to the operator's own nodes and to the block explorer and fiat ticker, so the
  practical exposure was small. Production `npm audit` returns to 0.

## Dependencies

- **Angular 20.3.34** (supersedes Dependabot [#1779](https://github.com/Ride-The-Lightning/RTL/pull/1779),
  which bumped `@angular/common` alone): all `@angular/*` framework packages move from 20.3.33
  to 20.3.34 together. Angular 22 ([#1732](https://github.com/Ride-The-Lightning/RTL/pull/1732))
  is a migration and stays open.
