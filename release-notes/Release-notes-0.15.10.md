# Release Notes — 0.15.10

This document collects the changes that go into the 0.15.10 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Code Health

- **Bound remaining unbounded LND alias-resolution fan-outs**
  ([#1651](https://github.com/Ride-The-Lightning/RTL/pull/1651), fixes
  [#1630](https://github.com/Ride-The-Lightning/RTL/issues/1630)).
  Mirrors the `runWithConcurrencyLimit(tasks, 20, done)` pattern introduced in #1629
  across the remaining unbounded `Promise.all(map(...))` alias-resolution fan-outs in
  the LND graph and channels controllers, preventing a large node from firing one
  alias-lookup request per peer, channel, or hop all at once.

  During review, a related race condition was found and fixed: the module-level
  `options` variable in these controllers was reassigned per-request, but
  `getAliasForChannel` and `getAliasFromPubkey` read it by closure rather than
  receiving it as a parameter. Once alias-resolution tasks were deferred across
  event-loop turns by the concurrency limiter, a concurrent request to a different
  node could overwrite `options` mid-fan-out, causing a task to send with the wrong
  node's credentials or URL. Both functions now accept an explicit `requestOptions`
  parameter, and each handler captures a per-request copy before building the task
  thunks. The catch blocks inside the concurrency-limit callbacks were also updated
  to log raw exceptions directly instead of routing them through `handleError`
  (which expects an HTTP-error-shaped value), matching the existing pattern used
  by `closeChannel`.
