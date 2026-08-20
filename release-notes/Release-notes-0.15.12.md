# Release Notes — 0.15.12

This document collects the changes that go into the 0.15.12 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Developer Tooling

- **Declare a minimum Node.js version**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD), closes
  [#1220](https://github.com/Ride-The-Lightning/RTL/issues/1220)).
  `package.json` carried no `engines` field, so npm installed RTL on any Node.js version
  without a word, and an unsupported runtime only showed up later as a confusing failure at
  `node rtl` — as in #1220, where two users on Node 19.x/20.0.0 got `Cannot find module
  'request-promise'` from an install that had reported success, and both were fixed by
  dropping to Node 18.15. (The dependency behind that particular report is gone: #1638
  replaced `request`/`request-promise` with axios in 0.15.9.) `engines.node` is now
  `>=20.19.0`, the floor the Angular 20 toolchain requires, so npm prints an `EBADENGINE`
  warning at install time instead. The docs said `v14 & above` in `CONTRIBUTING.md` and gave
  no version at all in the README; both now state the same floor.
