# Release Notes — 0.15.10

This document collects the changes that go into the 0.15.10 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **Auth: harden login request validation**
  ([#1654](https://github.com/Ride-The-Lightning/RTL/pull/1654)).
  Tightens server-side validation of authentication requests and adds regression coverage
  (`test/backend/authenticate.test.mjs`). Users who have two-factor authentication enabled
  are encouraged to update promptly.

- **Config & logging: reduce exposure of authentication secrets**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD)).
  Tightens redaction of authentication material in node logs and configuration API
  responses, and keeps runtime-only SSO state out of the persisted config file. Adds
  regression coverage (`test/backend/common.test.mjs`). Users are encouraged to update
  promptly.

## Code Health

- **Batch dependency update resolving the open Dependabot security PRs**
  ([#1653](https://github.com/Ride-The-Lightning/RTL/pull/1653)).
  Dependabot had three open security PRs against `master` (#1648, #1649, #1650). Rather than
  merging them piecemeal (they conflict with each other on `package-lock.json` and target the
  wrong branch for the release flow), the fixes were applied in one pass on the release branch.
  The only production exposure was `axios`, carrying ten advisories at 1.16.0 — prototype
  pollution in request-option merging, `formDataToJSON` recursion DoS, `maxBodyLength` bypasses
  on fetch/HTTP2 uploads, and a `NO_PROXY` bypass — now on 1.18.1 (a patch above Dependabot's
  validated 1.18.0, which was superseded during the batch). The lockfile was regenerated from
  scratch rather than incrementally patched, and the flagged transitive deps were moved to their
  fixed in-range versions (`fast-uri` 3.1.4, plus `form-data`, `qs`, `tough-cookie`, `tar`,
  `del` and `globby`). The dev toolchain took safe patch/minor bumps: `nodemon` 3.1.14,
  `eslint` 9.39.5, and `@typescript-eslint/*` 8.65.0.

  The unused `protractor` devDependency was also dropped. It had been dead since the Angular
  scaffold that introduced it — no `e2e/` directory, no `protractor.conf.js`, and no `e2e`
  target in `angular.json`, leaving a single line in `package.json` as its only reference —
  while dragging in 100 packages and the deprecated `request` stack. Removing it clears both
  remaining critical advisories (`request`, `form-data`) along with fourteen others
  (`adm-zip`, `selenium-webdriver`, `webdriver-manager`, `xml2js`, `tmp`, `rimraf` and the
  rest of the webdriver chain).

  `npm audit`: **50 vulnerabilities (2 critical, 37 high, 10 moderate, 1 low) → 29
  (0 critical, 23 high, 6 moderate)**, and **production dependencies are now clean at 0**
  (from 1 high). Everything still flagged is dev-only build tooling that cannot be fixed by a
  version bump: the Angular CLI chain (`@hono/node-server` and `@modelcontextprotocol/sdk`
  need Angular 21, i.e. `@angular/core` ^21 and TypeScript ≥5.9 — a framework migration, not a
  bump; #1650 is left for that work), the `@angular-eslint` line, and the karma/jasmine stack.
  None of it ships in the released bundle.
