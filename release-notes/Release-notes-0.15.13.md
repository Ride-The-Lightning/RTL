# Release Notes — 0.15.13

This document collects the changes that go into the 0.15.13 release. Each PR merged for
this release should add its entry under the appropriate section below.

## Bug Fixes

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

- **LND and Loop: the remaining query parameters were forwarded to the upstream as the
  string `undefined`**
  ([#1709](https://github.com/Ride-The-Lightning/RTL/pull/1709), fixes
  [#1698](https://github.com/Ride-The-Lightning/RTL/issues/1698)).
  Follow-up to [#1687](https://github.com/Ride-The-Lightning/RTL/pull/1687), which fixed
  `listInvoices` and `getPayments` and left the single-parameter sites of the same shape
  alone. Five more handlers built the upstream URL by concatenating `req.query.*` or
  `req.params.*` directly: `invoiceLookup` (`?payment_hash=`), `getNewAddress` (`?type=`),
  `closeChannel` (`?force=`, `&target_conf=`, `&sat_per_vbyte=`), `getUTXOs` (`?max_confs=`)
  and the Loop quote handlers (`&swap_publication_deadline=`, plus `req.params.amount`
  interpolated into the path). An omitted parameter was interpolated as the literal string
  `undefined` — which LND's REST gateway cannot parse as a `uint64`/`bool` and rejects with
  a 400, instead of the parameter simply being absent and the node applying its own
  default — and a value containing `&` or `=` passed through into the query string as extra
  parameters. Each handler now builds its query through the request layer's `qs` option
  (which maps to axios `params`, so it encodes and drops empty objects), validates at the
  boundary — non-negative safe integers for counts, `target_conf`, `sat_per_vbyte`,
  `max_confs`, `conf_target` and `swap_publication_deadline`; boolean spellings for
  `force`; a non-empty string for `payment_addr`/`payment_hash` and `type` — and omits a
  parameter that is absent so LND or Loop applies its own default. `invoiceLookup` also
  refuses a request carrying neither `payment_addr` nor `payment_hash`. Loop's
  `loopOutQuote`, `loopInQuote` and the two `*TermsAndQuotes` handlers get the same
  treatment; the two `TermsAndQuotes` handlers also no longer alias `options1` and
  `options2` to the same object, which previously sent two identical max-quote requests
  instead of one min and one max. Covered by `test/backend/lnd-invoiceLookup.test.mjs`,
  `test/backend/lnd-newAddress.test.mjs`, `test/backend/lnd-getUTXOs.test.mjs`,
  `test/backend/lnd-closeChannel.test.mjs` and `test/backend/loop-quotes.test.mjs`, which
  assert the outgoing query for an empty `req.query` and the 400s for each malformed value.

