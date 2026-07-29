# Release Notes — 0.15.10

This document collects the changes that go into the 0.15.10 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Code Health

- **Fix per-request options race condition in alias-resolution fan-outs**
  ([#1651](https://github.com/Ride-The-Lightning/RTL/pull/1651), fixes
  [#1630](https://github.com/Ride-The-Lightning/RTL/issues/1630)).
  The module-level `options` variable in `server/controllers/lnd/channels.ts` and
  `server/controllers/lnd/graph.ts` was reassigned per-request via
  `options = common.getOptions(req)`, but `getAliasForChannel` and `getAliasFromPubkey`
  read it by closure rather than receiving it as a parameter. Once alias-resolution tasks
  were deferred across event-loop turns by `runWithConcurrencyLimit`, a concurrent request
  to a different handler or node could overwrite `options` mid-fan-out, causing a task to
  send with the wrong node's credentials or URL. The two functions now accept an explicit
  `requestOptions` parameter, and each handler captures a per-request shallow copy before
  building the task thunks. The catch blocks inside the concurrency-limit callbacks now
  log raw exceptions directly instead of routing them through `handleError` (which expects
  an HTTP-error-shaped value), matching the pattern used by `closeChannel`.
