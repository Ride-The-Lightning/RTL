# Release Notes — 0.15.11

This document collects the changes that go into the 0.15.11 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Code Health

- **Batch dependency update resolving the open Dependabot security PRs**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD)).
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
