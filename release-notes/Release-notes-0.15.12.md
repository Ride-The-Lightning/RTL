# Release Notes — 0.15.12

This document collects the changes that go into the 0.15.12 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Enhancements

- **LND: open a channel with the entire wallet balance**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD), fixes
  [#155](https://github.com/Ride-The-Lightning/RTL/issues/155)).
  Emptying the on-chain wallet into a channel could not be done from the UI: the amount had
  to be entered by hand, and the balance itself is never a valid amount because nothing is
  left for the on-chain fee — or for the reserve LND holds back for anchor channels. The
  maximum can only be computed by the node, which is why this waited on
  [lnd#6903](https://github.com/lightningnetwork/lnd/pull/6903) (`fund_max` on
  `OpenChannelRequest`, LND 0.16.0). Both LND channel-open dialogs — the open-channel modal
  and the connect-peer stepper — now carry a "Use Entire Wallet Balance" toggle that
  disables the amount field and sends `fund_max` instead of `local_funding_amount`; LND
  rejects a request carrying both, so `postChannel` sends exactly one. The flag is only sent
  when the toggle is on, and the toggle only appears on LND 0.16.0 and above, so nothing
  changes for older nodes. Core Lightning already had the equivalent (`amount: "all"`);
  Eclair's `/open` has no fund-max option and is unchanged. Covered by backend tests
  (`test/backend/lnd-channels.test.mjs`) that pin which of the two fields reaches the node,
  and by component specs for the version gate and the dispatched payload.

## Developer Tooling

- **Declare a minimum Node.js version**
  ([#1681](https://github.com/Ride-The-Lightning/RTL/pull/1681), closes
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
