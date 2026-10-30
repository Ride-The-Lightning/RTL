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
  describes a login that keeps failing after an idle period until the URL is retyped; whether
  the stale cookies alone cause that is still being investigated on the issue.
