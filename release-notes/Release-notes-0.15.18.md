# Release Notes — 0.15.18

This document collects the changes that go into the 0.15.18 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **A wrong Loop address is reported instead of being taken for a Loop server**
  ([#1821](https://github.com/Ride-The-Lightning/RTL/pull/1821),
  [#660](https://github.com/Ride-The-Lightning/RTL/issues/660)). RTL treated any successful
  reply from `swapServerUrl` as a Loop reply. With the URL pointed at something else, such as
  Lightning Terminal's web page instead of loopd's REST port, the Loop screens showed nothing
  wrong, and starting a Loop Out or Loop In was reported as started although no swap existed.
  RTL now checks each reply and shows an error asking you to check the Loop address.

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

## Enhancements

## Code Health

- **Loop In no longer posts two fields the server ignores** ([#1818](https://github.com/Ride-The-Lightning/RTL/pull/1818),
  closes [#1817](https://github.com/Ride-The-Lightning/RTL/issues/1817)). The dialog sent
  `externalHtlc: true` and an empty `lastHop` with every Loop In. The server has never passed
  either to Loop, so swaps were, and still are, funded from the node's own wallet. The fields
  are gone, and a test keeps a request from switching external funding on.

## Dependencies

- **Node.js 22.23.5 / 24.22.3: the Docker image and the supported Node range move to the
  November 2026 Node.js security releases** ([#1820](https://github.com/Ride-The-Lightning/RTL/pull/1820),
  closes [#1819](https://github.com/Ride-The-Lightning/RTL/issues/1819)). Node.js published 16 CVEs
  on 2026-11-11 ([advisory](https://nodejs.org/en/blog/vulnerability/november-2026-security-releases)).
  None of them reaches RTL as deployed: they are in Node's HTTP/2 and TLS servers, its permission
  model and a few APIs RTL does not call, while RTL serves plain HTTP and leaves TLS to a reverse
  proxy. The runtime is updated all the same. `Dockerfile` builds on `node:24-alpine` (and
  `node:22-alpine` for 32-bit ARM), so the v0.15.18 images are built on Node 24.22.3 and 22.23.5.
  For bare-metal installs, `engines.node` in `package.json`, the README and `CONTRIBUTING.md` now
  state Node 22.23.5 or 24.22.3 and above. No RTL code changes.

## Developer Tooling

- **The regtest fixture can test Loop** ([#1816](https://github.com/Ride-The-Lightning/RTL/pull/1816),
  closes [#1815](https://github.com/Ride-The-Lightning/RTL/issues/1815)). RTL's Loop screens had
  no end-to-end test path short of a swap against a public Loop server. `docker compose --profile
  loop up -d` now adds Lightning Labs' regtest Loop server, a Loop client daemon on `alice`, and
  an RTL with Loop enabled on port 3002. `docker/scripts/verify-loop.sh` calls every Loop route
  through RTL and takes a Loop Out and a Loop In to completion.
- Review instructions and a threat model for PR review ([#1822](https://github.com/Ride-The-Lightning/RTL/pull/1822)).
