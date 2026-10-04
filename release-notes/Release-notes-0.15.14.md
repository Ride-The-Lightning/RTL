# Release Notes — 0.15.14

This document collects the changes that go into the 0.15.14 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Enhancements

- **CLN: show sweep countdown and close status for closing channels**
  ([#1734](https://github.com/Ride-The-Lightning/RTL/pull/1734), closes
  [#1733](https://github.com/Ride-The-Lightning/RTL/issues/1733)).
  A force-closed Core Lightning channel used to read `ONCHAIN` in Pending/Inactive Channels for
  the whole CSV delay, with no hint of when its funds return to the wallet. The State column now
  shows "Sweep in N blocks" while `onchaind` is waiting out the timelock, and Channel Information
  shows who closed the channel, the close transaction (copy and explorer link), the channel's
  status messages (latest first) and, under Show Advanced, its state-change history. All of it
  comes from fields `listpeerchannels` already returns, so there is no backend change. The
  countdown is read from the latest status message rather than derived from
  `their_to_self_delay`, which is the delay we impose on the peer, not the one we wait out. The
  close transaction is taken from `scratch_txid` and hidden when the peer broadcast the close,
  because `scratch_txid` is then our own unbroadcast commitment. The dialog body now scrolls, so
  the longer content stays reachable on short screens.

## Developer Tooling

- **Docker fixture: Eclair 0.14.2 and Bitcoin Core 31.1, built from official releases**
  ([#1736](https://github.com/Ride-The-Lightning/RTL/pull/1736), closes
  [#1689](https://github.com/Ride-The-Lightning/RTL/issues/1689)).
  The fixture ran Eclair 0.13.1 and bitcoind 30.0 because Polar, whose multi-arch images it
  used, has published nothing newer, and `acinq/eclair` is amd64-only. Eclair 0.14.1+ also
  needs Bitcoin Core 31. Both images are now built locally (`docker/eclair/`,
  `docker/bitcoind/`) from the projects' release artifacts, each checked against a pinned
  SHA-256 taken from the signed checksum file. Eclair is pinned to 0.14.2 because 0.14.3's
  checksums are signed with a different key from the one ACINQ documents. Upgrading the
  fixture surfaced a real Eclair 0.14 incompatibility in RTL, tracked in
  [#1735](https://github.com/Ride-The-Lightning/RTL/issues/1735).
