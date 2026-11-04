# Release Notes — 0.15.17

This document collects the changes that go into the 0.15.17 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Code Health

- **Docker image moves to Node 24 LTS, and CI starts testing Node 26**
  ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD), issue
  [#1797](https://github.com/Ride-The-Lightning/RTL/issues/1797)). Node 22 reaches end of life
  in April 2027. The image was built on `node:22-alpine`. It now uses `node:24-alpine`
  (supported until April 2028), which was already in the CI test matrix and the `engines`
  range. The lint, build-output and release-artifact jobs move to Node 24 with it, and Node
  26 joins the test matrix so it is tested before the image moves to it. The production
  bundle built on Node 22, 24 and 26 is byte-identical to the committed `frontend/`, so
  nothing in it changes. Git installs on Node 22 stay supported until its end of life.
