# Release Notes — 0.15.13

This document collects the changes that go into the 0.15.13 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

- **Loop requests could go to another node's swap server, and the missing-URL guard never fired**
  ([#1715](https://github.com/Ride-The-Lightning/RTL/pull/1715), fixes
  [#1714](https://github.com/Ride-The-Lightning/RTL/issues/1714)).
  `server/controllers/shared/loop.ts` kept one module-level options object, assigned only by
  `loopInfo` and reused by the other ten handlers. In a multi-node RTL a request made while
  node B was selected went to node A's Loop server with A's `loop.macaroon`, and the "Loop
  Server URL is missing" check tested `options.url`, a key `setSwapServerOptions` never sets,
  so a node with no `swapServerUrl` was sent upstream with no base URL. Every handler now
  builds its options from the session's selected node on each request (as the LND and Boltz
  controllers already do) and answers 500 before any upstream call when the URL is not
  configured. A quote request no longer needs a prior `/loop/info` call, and `swap` checks
  that its `id` path parameter is a hex swap hash before it goes into the URL.
  `test/backend/loop-options.test.mjs` covers the missing-URL case and a node switch.

- **Omitted query parameters were sent upstream as the string `"undefined"`**
  ([#1713](https://github.com/Ride-The-Lightning/RTL/pull/1713), fixes
  [#1698](https://github.com/Ride-The-Lightning/RTL/issues/1698); follow-up to #1687).
  The remaining handlers that glued `req.query`/`req.params` into the LND or Loop URL —
  `invoiceLookup`, `getNewAddress`, `closeChannel`, `getUTXOs` and the four Loop quote
  endpoints — interpolated an absent value as `undefined` (LND answers 400) and let a value
  containing `&` add parameters upstream. RTL's own frontend always sends these parameters, so
  this only affected direct API callers. Each handler now builds its query through the
  request wrapper's `qs` (axios encodes it), omits what is absent so the node applies its own
  default (an empty value counts as absent, as before), and answers 400 for a malformed value
  via three small parsers added to `server/utils/common.ts`; `closeChannel` also checks that
  its `channelPoint` path parameter is a `txid:index` outpoint before it goes into the URL.
  In passing, the Loop terms-and-quotes handlers assigned the same options object to both
  the min and max quote requests, so both fetched the max-amount quote; they now get their
  own. `test/backend/query-params.test.mjs` covers every handler.

- **First login failed with "Invalid CSRF token, form tempered" when entering at `/rtl/`**
  ([#1711](https://github.com/Ride-The-Lightning/RTL/pull/1711), fixes
  [#1710](https://github.com/Ride-The-Lightning/RTL/issues/1710)).
  The frontend takes its CSRF token from the `XSRF-TOKEN` cookie, which `server/utils/app.ts`
  mints only in the catch-all that serves `index.html` for deep links (`/rtl/login`,
  `/rtl/home`, …). `GET /rtl/` — what people type, and where `/rtl` redirects — was answered
  by `express.static` instead, mounted above the catch-all, so the page loaded with no token
  and the first login POST failed the CSRF check with 403; the error handler re-mints a token
  on that response, which is why the second attempt worked and why a refresh (now on
  `/rtl/login`) worked first time. The static handler was that way under `csurf` too, but
  since 0.15.10 tokens are signed with a per-boot secret, so every container restart brought
  the 403 back. `express.static` is now mounted with `index: false`, leaving the directory
  index to the catch-all like every other page, and any spelling that resolves to the index
  file (`/rtl/index.html`, repeated slashes, dot segments, percent-encoded bytes — anything
  `send`'s decode + normalize collapses to it) redirects to `/rtl/` with the query string
  preserved, so there is one entry path; that page is sent with `Cache-Control: no-store`
  since it carries a per-client token pair; `/rtl` still redirects to `/rtl/`, static
  assets are served as before, and the BTCPay SSO entry (`/rtl/api/authenticate/cookie`)
  already went through the catch-all and is unchanged. A tab left open across an RTL restart
  still fails its first login once (its token is void until the page reloads); that is
  accepted. `test/backend/csrf-landing-page.test.mjs` boots `rtl.js` outside development mode
  (where CSRF is off) and asserts the cookie arrives with `GET /rtl/`, that a login after it
  succeeds first time, that a login without a token is still refused, and that the redirect
  and static assets are intact.
