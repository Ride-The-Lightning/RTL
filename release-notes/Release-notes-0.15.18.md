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
- **An LND wallet restored from a seed shows its on-chain funds** ([#1814](https://github.com/Ride-The-Lightning/RTL/pull/1814),
  fixes [#494](https://github.com/Ride-The-Lightning/RTL/issues/494)). RTL initialised the wallet
  without a recovery window, so LND did not scan for the addresses the wallet had used and the
  restored wallet showed a zero balance. Restoring from an existing seed now sends a recovery
  window, 2500 addresses by default as `lncli` does, and the Cipher step has a field to raise it
  for a heavily used wallet. A wallet created from a new seed is initialised as before.
- **RTL no longer rewrites `RTL-Config.json` on every start** ([#1813](https://github.com/Ride-The-Lightning/RTL/pull/1813),
  by [@bitbandi](https://github.com/bitbandi)). The start-up step that renames the pre-0.15.1 node
  keys `Authentication` and `Settings` to lowercase wrote the file back whether or not it had
  renamed anything. That reformatted a hand-edited file and changed its modification time on each
  start. The file is now written only when a key was renamed. One consequence: with a read-only
  config file RTL used to refuse to start, and it now starts; saving settings from the UI still
  needs the file to be writable, and fails with an error at that point.

## Enhancements

## Code Health

- **Loop In no longer posts two fields the server ignores** ([#1818](https://github.com/Ride-The-Lightning/RTL/pull/1818),
  closes [#1817](https://github.com/Ride-The-Lightning/RTL/issues/1817)). The dialog sent
  `externalHtlc: true` and an empty `lastHop` with every Loop In. The server has never passed
  either to Loop, so swaps were, and still are, funded from the node's own wallet. The fields
  are gone, and a test keeps a request from switching external funding on.

## Developer Tooling

- **The regtest fixture can test Loop** ([#1816](https://github.com/Ride-The-Lightning/RTL/pull/1816),
  closes [#1815](https://github.com/Ride-The-Lightning/RTL/issues/1815)). RTL's Loop screens had
  no end-to-end test path short of a swap against a public Loop server. `docker compose --profile
  loop up -d` now adds Lightning Labs' regtest Loop server, a Loop client daemon on `alice`, and
  an RTL with Loop enabled on port 3002. `docker/scripts/verify-loop.sh` calls every Loop route
  through RTL and takes a Loop Out and a Loop In to completion.
