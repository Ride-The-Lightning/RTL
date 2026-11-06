# Release Notes — 0.15.17

This document collects the changes that go into the 0.15.17 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **Logout clears the session and CSRF cookies on the path they were set with**
  ([#1795](https://github.com/Ride-The-Lightning/RTL/pull/1795), issue
  [#1794](https://github.com/Ride-The-Lightning/RTL/issues/1794)). 0.15.16 scoped the
  `connect.sid`, `_csrf` and `XSRF-TOKEN` cookies to `Path=/rtl`
  ([#1785](https://github.com/Ride-The-Lightning/RTL/pull/1785)), but the logout handler kept
  clearing `connect.sid` with Express's default `Path=/`. A browser identifies a cookie by name,
  domain and path, so the deletion named a cookie that did not exist and the browser kept the
  cookie of the destroyed session, together with the CSRF token pair bound to that session id,
  which was never cleared. The logout now deletes all three cookies on the base-href path, and
  the next page load mints a token pair for the new session. A backend test asserts the three
  deletions and their path; it failed on the 0.15.16 build and passes now. The report also
  describes a login that keeps failing until the URL is retyped; that has a separate cause,
  fixed by #1799 below.
- **Opening RTL at the site root no longer breaks login**
  ([#1799](https://github.com/Ride-The-Lightning/RTL/pull/1799), issue
  [#1794](https://github.com/Ride-The-Lightning/RTL/issues/1794)). This is the cause of the
  repeated login failure in that report. Any path outside `/rtl`, such as `host:3000/`, was
  answered with the app itself, and the router then moved the address bar to `/rtl/login`
  without reloading the page. A browser scopes `document.cookie` to the URL a page was loaded
  at, so since 0.15.16 scoped the CSRF cookies to `Path=/rtl`
  ([#1785](https://github.com/Ride-The-Lightning/RTL/pull/1785)) such a page could not read
  `XSRF-TOKEN`. It sent its login without the token header, and every attempt failed with
  "Invalid Csrf Token, Form Tempered" until a reload under `/rtl`. Page requests outside
  `/rtl` are now redirected to `/rtl/`, keeping the query string. A backend test asserts the
  redirect and a first login entered at `/`; both failed before the change.
- **Routing CSV exports keep the same columns in the same order**
  ([#1803](https://github.com/Ride-The-Lightning/RTL/pull/1803), issue
  [#1545](https://github.com/Ride-The-Lightning/RTL/issues/1545)). An export's header was every
  key its rows held, in the order first seen. That order changed with the events in the file:
  newer LND releases add `incoming_htlc_id` and `outgoing_htlc_id`, and RTL sets the alias of
  whichever channel it finds first in the channel list, so `alias_in` and `alias_out` could swap
  places. CLN's `in_channel_alias`/`out_channel_alias` and Eclair's `fromChannelAlias`/
  `toChannelAlias` (with their short channel ids) were set the same way. Files from different
  months then didn't line up when combined. Rows always matched their own header, so no exported
  value was ever in the wrong column. The LND and Eclair forwarding exports and the CLN
  forwarding, failed and local-failed exports now use a fixed column list, with an empty cell
  where an event lacks a field and any field the list doesn't name added at the end. Eclair's
  list covers the fields RTL gives both Eclair 0.13 and 0.14 relays. Specs covering the issue's
  two LND event shapes and both Eclair versions failed before the change. On the regtest
  fixture, the Reports → Routing export from alice (LND), CLN and Eclair 0.14 gave the fixed
  headers.
- **2FA login tolerates a server clock that is slightly off**
  ([#1806](https://github.com/Ride-The-Lightning/RTL/pull/1806), issue
  [#1337](https://github.com/Ride-The-Lightning/RTL/issues/1337)). The login checked the
  authenticator code against the RTL server's clock and accepted only the current 30 second
  code. On a server without time sync the clock drifts, so valid codes started failing,
  first now and then and eventually always, until the login locked. Enabling 2FA still
  succeeded, because that check runs on the browser's clock. The login now also accepts the
  codes either side of the current one, which covers up to 30 seconds of drift, and a rejected
  code's log entry suggests checking the server clock. A larger drift still needs the clock
  synced (NTP).

## Enhancements

- **LND: label any on-chain transaction from the Transactions table**
  ([#1801](https://github.com/Ride-The-Lightning/RTL/pull/1801), issue
  [#1261](https://github.com/Ride-The-Lightning/RTL/issues/1261)). A label could only be set
  through a UTXO's Actions menu, so a received transaction whose outputs were already spent
  could not be labelled at all. Transaction rows now have an Actions menu with View Info and
  Label, using the same LND call as the UTXO action. LND labels a whole transaction, so all of
  its outputs share the label. The table shows a txid in display order, while LND takes the
  bytes in reverse order, base64-encoded; the dialog converts it. Specs cover the conversion,
  checked against a txid pair LND returned, and both label paths. Labelling a received, spent
  transaction on the regtest fixture through the UI stored the label in LND.

## Code Health

- **Docker image moves to Node 24 LTS, and CI starts testing Node 26**
  ([#1798](https://github.com/Ride-The-Lightning/RTL/pull/1798), issue
  [#1797](https://github.com/Ride-The-Lightning/RTL/issues/1797)). Node 22 reaches end of life
  in April 2027. The image was built on `node:22-alpine`. It now uses `node:24-alpine`
  (supported until April 2028), which was already in the CI test matrix and the `engines`
  range. The lint, build-output and release-artifact jobs move to Node 24 with it, and Node
  26 joins the test matrix so it is tested before the image moves to it. The production
  bundle built on Node 22, 24 and 26 is byte-identical to the committed `frontend/`, so
  nothing in it changes. Git installs on Node 22 stay supported until its end of life.
- **follow-redirects 1.16.1 → 1.16.2** ([#1800](https://github.com/Ride-The-Lightning/RTL/pull/1800)).
  `npm audit --omit=dev` flagged the axios dependency as high severity under
  [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p): a `sensitiveHeaders`
  array created in another JavaScript realm was discarded, so the headers it named could follow
  a cross-origin redirect. RTL never sets `sensitiveHeaders`, and axios builds that list in the
  same realm as follow-redirects, so RTL was not exposed. The bump is lockfile-only, within
  axios's existing `^1.16.0` range, and clears the audit.

## Developer Tooling

- Added a Code Review section to `CONTRIBUTING.md`
  ([#1802](https://github.com/Ride-The-Lightning/RTL/pull/1802)).
