# Release Notes — 0.15.18

This document collects the changes that go into the 0.15.18 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **The Dockerfile builds on 32-bit ARM again** ([#1808](https://github.com/Ride-The-Lightning/RTL/pull/1808)).
  0.15.17 moved the image to `node:24-alpine`
  ([#1798](https://github.com/Ride-The-Lightning/RTL/pull/1798)), which publishes no
  `linux/arm/v7` image, so building the Dockerfile for 32-bit ARM failed, both in the release
  workflow and natively on a 32-bit ARM board. The 0.15.17 arm/v7 image was built separately on
  `node:22-alpine`. The Dockerfile now picks `node:22-alpine` for 32-bit ARM itself (override with
  the `ARM32_BASE_DISTRO` build argument) and keeps `node:24-alpine` for amd64 and arm64.
- **An LND wallet restored from a seed shows its on-chain funds** ([#TBD](https://github.com/Ride-The-Lightning/RTL/pull/TBD),
  fixes [#494](https://github.com/Ride-The-Lightning/RTL/issues/494)). RTL initialised the wallet
  without a recovery window, so LND did not scan for the addresses the wallet had used and the
  restored wallet showed a zero balance. Restoring from an existing seed now sends a recovery
  window, 2500 addresses by default as `lncli` does, and the Cipher step has a field to raise it
  for a heavily used wallet. A wallet created from a new seed is initialised as before.

## Enhancements

## Code Health
