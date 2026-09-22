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
