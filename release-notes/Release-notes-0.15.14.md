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
