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
- **RTL no longer rewrites `RTL-Config.json` on every start** ([#1813](https://github.com/Ride-The-Lightning/RTL/pull/1813),
  by [@bitbandi](https://github.com/bitbandi)). The start-up step that renames the pre-0.15.1 node
  keys `Authentication` and `Settings` to lowercase wrote the file back whether or not it had
  renamed anything. That reformatted a hand-edited file and changed its modification time on each
  start. The file is now written only when a key was renamed. One consequence: with a read-only
  config file RTL used to refuse to start. It now starts, unless the file still has those legacy
  keys and so needs migrating. Saving settings from the UI still needs the file to be writable,
  and fails with an error at that point.

- **Monthly reports no longer fail, or book entries to the wrong day, in a month with a
  daylight-saving change** ([#1826](https://github.com/Ride-The-Lightning/RTL/pull/1826),
  fixes [#1331](https://github.com/Ride-The-Lightning/RTL/issues/1331)). The monthly view of the
  routing and transactions reports worked out each entry's day by dividing the seconds since the
  1st by 24 hours. After clocks go back, that put an entry from the last hour of the last day
  past the end of the month, and the report showed "No routing report for the selected period":
  every October in European timezones, every November in US ones. It also moved entries from
  the 23:00 hour to the next day after clocks go back, and from the 00:00 hour to the previous
  day after they go forward, and the transactions table dated its rows an hour off. The day
  now comes from the local calendar, for LND, Core Lightning and Eclair. Yearly views were not
  affected.

- **LND and Eclair: a pasted payment request or lookup key is sent as one value**
  ([#1827](https://github.com/Ride-The-Lightning/RTL/pull/1827)). The screens that decode a payment
  request, or look up a node, channel, payment or invoice, appended the entered text to the
  request URL as it was. Text containing `/`, `?`, `#` or `&` was therefore not sent as entered:
  part of it was dropped or read as a different part of the URL. The text is now encoded as a
  single path segment or query value. The same applies to every other value RTL puts in a
  request URL: when it queries a route, disconnects a peer, closes a channel, updates Eclair
  relay fees, connects an Eclair peer, backs up, verifies, restores or downloads a channel
  backup, fetches a block-explorer transaction, and fetches a Loop quote or swap. Core Lightning
  already sent these values in the request body. Specs cover each request.

- **Selecting a node is a POST** ([#1828](https://github.com/Ride-The-Lightning/RTL/pull/1828)).
  Selecting a node changes what the session works on, so the request for it is now a POST, like
  RTL's other requests that change something:
  `POST /api/conf/updateSelNode/:currNodeIndex/:prevNodeIndex`. The node selector posts to it. A client that calls this route itself has to send a POST with the session token
  and the CSRF token; a GET to that address no longer selects a node. After upgrading, a page
  still open from before the upgrade needs a reload before it can switch nodes.
  `node-switch-post.test.mjs` covers the POST, the GET and a POST without the token.

- **Dialogs show list entries as written**
  ([#1830](https://github.com/Ride-The-Lightning/RTL/pull/1830)). In the information and
  confirmation dialogs, an entry of a list field containing `<`, `>` or `&` was not shown as
  written. The dialogs now show every list entry as plain text. The Hops lines in LND's HTLC
  Information dialog and the address lines in Core Lightning's liquidity ad dialog look as
  before. Specs cover both dialogs and the hop lines.

- **Connect peer: a pubkey is matched whatever case it is entered in**
  ([#1832](https://github.com/Ride-The-Lightning/RTL/pull/1832)). After connecting a peer, RTL
  looks the new peer up in the node's peer list, to show it first and to label the dialog's
  next step. The lookup compared the pubkey as typed with the lower-case pubkeys the node
  lists, so a pubkey entered in upper case was not found. The comparison is now in lower case
  on LND, Core Lightning and Eclair, and a list without a match keeps the node's order. When
  the list does not have the peer, the dialog carries on with the pubkey that was entered, and
  the LND dialog shows the pubkey when the peer has no alias. Backend tests and specs cover
  each implementation.

- **Core Lightning: a liquidity lease is funded at the fee rate entered, and its cost follows
  every edit** ([#1833](https://github.com/Ride-The-Lightning/RTL/pull/1833)). The Open
  Liquidity Channel dialog asks for the fee rate in Sats/vByte but sent the number to Core
  Lightning as sats per 1,000 vBytes, so Core Lightning used its minimum fee rate, at which a
  seller can decline the lease. It now converts the rate as RTL's other Core Lightning fee rate
  fields do, so the same number now funds the channel at that rate in Sats/vByte. The lease
  cost, on the Liquidity Ads page and in the dialog, was recalculated only on a key press, so
  changing the amount or fee rate with the arrow buttons or by pasting left the old cost on
  screen. It is now recalculated on every change, and when the dialog opens. Every Core
  Lightning fee rate field (open channel, connect peer, on-chain send, bump fee and the lease)
  now also sends a whole number: some decimal rates, such as 16.1 Sats/vByte, came out as a
  fraction that Core Lightning rejects. Specs cover the fee rates sent and both cost displays.

- **The amount in another currency follows every edit of an invoice, offer or keysend amount**
  ([#1833](https://github.com/Ride-The-Lightning/RTL/pull/1833)). With fiat conversion on, the
  converted amount under the field was updated only on a key press, so changing the amount with
  the arrow buttons or by pasting left the old conversion on screen. It is now updated on every
  change, on LND, Core Lightning and Eclair. Specs cover the create invoice dialog of each
  implementation and the keysend amount.

- **Sign and verify message: editing a field clears the previous result**
  ([#1833](https://github.com/Ride-The-Lightning/RTL/pull/1833)). On LND and Core Lightning, the
  Sign page cleared the signature when the message changed, and the Verify page hid its result
  when the message or signature changed, but only on a key press. Pasting or dropping text with
  the mouse left the previous signature or result on screen next to the new text. Both now react
  to every change. Specs cover both pages on both implementations.

- **Core Lightning: Bump Fee uses the address its own request returns**
  ([#1835](https://github.com/Ride-The-Lightning/RTL/pull/1835)). The Bump Fee dialog asked for a
  new address and then took the next new address generated anywhere in RTL, and it kept waiting
  after it closed. If its own request failed, an address generated later, for example on the
  Receive screen, was taken for its own. The dialog now requests the address directly, spends
  only to the address that request returns, and stops listening when it closes. A failed address
  request shows its error inside the dialog, which stays open, instead of in a separate alert.
  The dialog also sent output index 0 as an empty index (`<txid>:`), so a fee bump on output 0
  failed; it now sends `<txid>:0`. Specs cover the dialog and the new request.

- **A session token ends with its session** ([#1838](https://github.com/Ride-The-Lightning/RTL/pull/1838)).
  The token RTL issues at login was signed with no expiry and checked for its signature only,
  so it stayed valid until RTL restarted: logging out, the inactivity logout and a password
  change ended the session but not the token. Each token now belongs to the session it was
  issued to, and is accepted only together with that session's cookie, for API requests and
  for the websocket. Logging out (also on inactivity) ends the session's tokens and closes its
  websocket. A password change ends every earlier token and closes every websocket, so other
  browsers have to log in again. The tab that changed it hands the new token to the other tabs of
  its browser, which reconnect with it; a request one of them sent with its earlier token is sent
  again with the new one rather than logging the browser out. A websocket that reconnects, after
  a password change or a network error, receives its node's live updates again, and closing one
  tab no longer stops them in the browser's other tabs. A token also expires
  at most one day after the login that issued it, after which RTL asks for a login again. It is
  not renewed, so a user who is still active then is logged out too. A script
  that reuses a token from the browser now needs that browser's session cookie as well.
  `session-token-lifecycle.test.mjs` covers each case, `websocket-server.test.mjs` the live
  updates, and the `AuthInterceptor`,
  `SessionService`, `WebSocketClientService` and `RTLEffects` specs cover the hand-off to the
  other tabs.

- **Debug logging writes request URLs, not request headers** ([#1839](https://github.com/Ride-The-Lightning/RTL/pull/1839)).
  At `logLevel` DEBUG, LND's all-transactions request and the Loop In and Loop Out
  terms-and-quotes requests logged their whole request options, headers included. They now log
  the URL and query only, as the other requests do, and the logger writes any header map it is
  given with its values masked, as well as the `Grpc-Metadata-macaroon`, `rune` and
  `Authorization` headers wherever they appear. `debug-log-auth-headers.test.mjs` covers each request and the
  logger.

- **Core Lightning: the configuration request returns only the option RTL reads**
  ([#1839](https://github.com/Ride-The-Lightning/RTL/pull/1839)). The Experimental settings page
  reads one option from Core Lightning's `listconfigs`, `experimental-dual-fund`, but
  `GET /api/cln/utility/listConfigs` returned the node's whole configuration and logged it at
  DEBUG. It now returns, and logs, `{ configs: { "experimental-dual-fund": … } }` only; a
  script that read other options from this route has to ask Core Lightning directly.
  `cln-list-configs.test.mjs` covers the reply and the log.

- **Core Lightning: the Experimental settings page shows the channel funding policy status
  when the node does not report `experimental-dual-fund`**
  ([#1840](https://github.com/Ride-The-Lightning/RTL/pull/1840)). The page read
  `configs['experimental-dual-fund'].set` from the node's configuration without checking that
  the option was there, so a reply without it raised an error in the page instead of showing
  the policy as disabled. It now shows it as disabled. A spec covers both replies.

- **LND: channel backups are written to the backup file only, not also to the log**
  ([#1840](https://github.com/Ride-The-Lightning/RTL/pull/1840)). At `logLevel` DEBUG, the backup
  RTL takes on every LND `getinfo`, and the one taken from the Backup page, were written into the
  node's log as well as into the backup file. The log line now names the node and the backup
  file instead. `channel-backup-log.test.mjs` covers both paths.

- **Eclair and Core Lightning: a websocket message RTL cannot read or pass on is skipped**
  ([#1841](https://github.com/Ride-The-Lightning/RTL/pull/1841)). RTL's Eclair websocket client
  parsed each message from Eclair with `JSON.parse` in its message handler, read its `type` and
  serialised it again to pass it on, and the Core Lightning client serialised each message the
  same way, with nothing to catch an error in either handler. A message that was not JSON, was
  JSON `null`, or was nested too deeply to serialise therefore stopped RTL. Such a message is now
  skipped with a warning in the node's log, and later events keep arriving. The LND client
  already handled this. `eclair-websocket-frames.test.mjs` and `cln-websocket-messages.test.mjs`
  cover each kind of message.

- **The configuration served before login carries only what the login page uses**
  ([#1842](https://github.com/Ride-The-Lightning/RTL/pull/1842)). Without a session token,
  `GET /api/conf` returned the configuration with a list of fields removed. It now returns only
  `selectedNodeIndex`, `disableAuth`, `enable2FA`, `SSO.rtlSSO` and the selected node's `index`,
  `userPersona`, `themeMode` and `themeColor`. The full configuration still comes with a valid session token,
  as the app fetches it after login. A selected index that matches no node now falls back to the
  first node instead of failing. `conf-without-token.test.mjs` covers the answer with and
  without a token.

## Enhancements

- **Fees are shown in Sats instead of mSats** ([#1823](https://github.com/Ride-The-Lightning/RTL/pull/1823),
  closes [#468](https://github.com/Ride-The-Lightning/RTL/issues/468)). The fee of a circular
  rebalance, of a forwarding event and of a queried route, and the value and fee of a looked-up
  payment, were shown in mSats while the amounts beside them were in Sats. They are now in Sats
  with the mSat part as up to three decimals, so `27552` mSats reads `27.552`. This covers LND
  and Core Lightning, including the detail dialogs and the payment-sent message; filtering the
  fee column matches the Sats value. On Eclair the fee of a payment part was already in Sats
  under a `Fees (mSats)` heading, which now says Sats. Channel policy values (base fee, fee
  rate, min/max HTLC) stay in mSats, the unit they are set in, and CSV downloads are unchanged.

- **The startup log states the address RTL is listening on, and `host` is documented**
  ([#1824](https://github.com/Ride-The-Lightning/RTL/pull/1824),
  closes [#731](https://github.com/Ride-The-Lightning/RTL/issues/731)). With no `host` in
  `RTL-Config.json`, RTL listens on every network interface, but the startup log said
  `http://localhost:3000` and one line of the docs gave the default as localhost, so an install
  could be reachable from the network without its operator knowing. The log now reports the
  address actually bound and, when no `host` is set, says that other machines can connect and
  how to restrict it. `Application_configurations.md` explains what to set for a local-only,
  LAN, reverse-proxy or container install. The default is unchanged: to accept local
  connections only, set `"host": "127.0.0.1"` (or `HOST`).

- **Eclair: the Channel Information dialog shows the funding transaction id**
  ([#1825](https://github.com/Ride-The-Lightning/RTL/pull/1825),
  closes [#634](https://github.com/Ride-The-Lightning/RTL/issues/634)). On Eclair the dialog
  showed only the channel id, which is derived from the funding outpoint and cannot be looked up
  on a block explorer. It now shows the funding transaction id for open, pending and inactive
  channels, with a link to the node's block explorer, as the Core Lightning dialog does. A
  channel whose funding transaction does not exist yet has no such row.

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
- Coding guidelines, review rules, a threat model and `npm run check` for contributors
  ([#1822](https://github.com/Ride-The-Lightning/RTL/pull/1822)).
- Pull requests that change what a user sees carry before and after screenshots
  ([#1829](https://github.com/Ride-The-Lightning/RTL/pull/1829)).
- `npm run test` runs the frontend specs in about a minute on macOS instead of several
  ([#1831](https://github.com/Ride-The-Lightning/RTL/pull/1831)).
