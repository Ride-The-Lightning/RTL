# RTL invariants — index

RTL moves funds, holds node credentials and drives three backends (LND, Core Lightning,
Eclair). The expected behavior for those areas is spread across code, tests and maintainer
knowledge. This index is the shared, written definition of "correct": short statements of what
must always hold, whatever the implementation looks like.

An invariant describes a **required behavior**, not what the current code happens to do. It is
stated as a backend API contract or as user-observable behavior, never in terms of components,
classes or files, so it stays valid as the code changes. Test links are metadata, not part of
the invariant.

This first slice covers AUTH, SEC, PAY and NODE. It is deliberately partial. Area pages
(`auth.md`, `payments.md`, …) can be split out once a section outgrows this index.

## Conventions

- **IDs are stable.** An ID uses an area prefix (`AUTH-001`, `PAY-003`) and is never reused or
  renumbered. A retired entry keeps its ID and points at its replacement.
- **Scope and exceptions are part of the entry.** If current behavior is wrong, that is a
  decision or a bug, not an invariant: record it in an issue or PR instead of weakening the
  statement here.
- **Coverage** is one of:
  - `covered` — at least one automated test fails when the invariant is broken;
  - `partial` — only some paths, properties or node implementations are tested;
  - `none` — no test enforces it yet; tracked as a gap below.
- Backend regression tests live in `test/backend/` (`npm run testbackend`); frontend specs live
  beside their components under `src/` and run in the Karma/Jasmine pass of `npm run test`.
- A PR that changes behavior in a covered area cites the affected IDs and updates this index in
  the same PR. Adding an invariant means adding or naming the test that would fail without it.

## Index

| ID | Area | Short name | Enforcing tests | Coverage |
| --- | --- | --- | --- | --- |
| [AUTH-001](#auth-001) | Authentication | Node-facing routes require a session | [`route-guards.test.mjs`](../../test/backend/route-guards.test.mjs) | covered |
| [AUTH-002](#auth-002) | Authentication | 2FA cannot be bypassed at login | [`authenticate.test.mjs`](../../test/backend/authenticate.test.mjs) | covered |
| [AUTH-003](#auth-003) | Authentication | Logout revokes the session | [`logout-and-password-reset.test.mjs`](../../test/backend/logout-and-password-reset.test.mjs) | covered |
| [AUTH-004](#auth-004) | Authentication | Expired sessions are refused | — | none |
| [SEC-001](#sec-001) | Secrets handling | Credentials stay server-side | [`common.test.mjs`](../../test/backend/common.test.mjs), [`rtlconf.test.mjs`](../../test/backend/rtlconf.test.mjs) | partial |
| [SEC-002](#sec-002) | Secrets handling | State changes need a CSRF token | [`csrf-landing-page.test.mjs`](../../test/backend/csrf-landing-page.test.mjs), [`logout-and-password-reset.test.mjs`](../../test/backend/logout-and-password-reset.test.mjs) | partial |
| [PAY-001](#pay-001) | Fund-moving actions | Explicit confirmation before funds move | [`confirmation-message.component.spec.ts`](../../src/app/shared/components/data-modal/confirmation-message/confirmation-message.component.spec.ts), [`send-payment.component.spec.ts`](../../src/app/lnd/transactions/send-payment-modal/send-payment.component.spec.ts) | partial |
| [PAY-002](#pay-002) | Fund-moving actions | The amount paid is the amount approved | [`cln-offer-payment.test.mjs`](../../test/backend/cln-offer-payment.test.mjs) | partial |
| [PAY-003](#pay-003) | Fund-moving actions | Fee limits are honored before paying | [`eclair-rebalance-fee-limit.test.mjs`](../../test/backend/eclair-rebalance-fee-limit.test.mjs), [`lnd-send-payment-no-route.test.mjs`](../../test/backend/lnd-send-payment-no-route.test.mjs) | partial |
| [NODE-001](#node-001) | Multi-node | Requests reach only the selected node | [`node-selection.test.mjs`](../../test/backend/node-selection.test.mjs), [`node-implementation-guard.test.mjs`](../../test/backend/node-implementation-guard.test.mjs), [`cross-session-options.test.mjs`](../../test/backend/cross-session-options.test.mjs) | covered |

## Definitions

### AUTH-001

Every route that talks to a node requires an authenticated session; the guard runs before the
route's controller. Exception: the login page's own routes — authenticate, logout, `/api/conf`
and `/api/conf/rates` — are reachable without a session.
*Enforced by* `every route outside the login page set carries isAuthenticated first`, which
walks every registered route, plus explicit 401 probes for a node route and a config route.

### AUTH-002

When two-factor authentication is enabled, a login is accepted only with a valid second factor;
repeated invalid factors lock the address out. Exceptions: with no configured secret there is no
second factor to verify; re-authorization from an already authenticated session uses the
password alone. Failed attempts are keyed on the socket peer, never on a client-supplied
`X-Forwarded-For`, and a lockout must not reveal whether the password was right.

### AUTH-003

Logging out ends the session: the same cookies cannot authorize a later request, the session,
`_csrf` and `XSRF-TOKEN` cookies are cleared on the path they were set with, and a cross-site GET
cannot end the session.

### AUTH-004

A session that has passed its lifetime is refused on the next node-facing request, in the same
way as a logged-out or missing session. No test currently drives session or cookie expiry, so
this is a gap rather than a verified property.

### SEC-001

Macaroons, runes, passwords, TOTP seeds and SSO cookie values never reach the browser, the
application log or an error response; credentials supplied by a caller cannot overwrite the
server-held values. Existing tests mask secrets in configuration responses, strip them from
persisted settings and keep file paths out of errors. They check individual fields and helpers;
no test audits a whole response or every route, hence `partial`.

### SEC-002

Outside development mode, requests that change state are protected by a double-submit CSRF
token bound to the session and scoped to the configured base href. The token is issued on page
loads and echoed in a header; a missing or mismatched token is refused, and a failed check does
not leave the client unable to retry. Login, logout and cookie scoping are covered end to end;
other state-changing route families rely on the shared middleware without per-route tests.
Exception: the middleware is not mounted when `NODE_ENV=development`.

### PAY-001

Before funds move, the user sees the amount, fee and destination exactly as they will be sent
and confirms explicitly; navigating away or dismissing the dialog counts as "no", and one
confirmation submits at most one payment. The frontend specs cover the operator's yes/no reply
and amount/fee decoding, but nothing yet asserts that the displayed values equal the values
sent, or that a single confirmation cannot submit twice.

### PAY-002

A payment whose resolved amount differs from the amount the operator approved is refused before
funds move; a missing expected amount or an unresolvable invoice is refused too. The CLN BOLT12
offer path is covered in both directions (too much and too little) and refuses a mismatched
offer. The equivalent check for LND and Eclair invoice payments is not covered, so
cross-implementation parity is still a gap.

### PAY-003

A configured fee limit is passed to the node and enforced before a payment is made: an
over-limit route is refused without paying, a negative limit is never defaulted or sent, and a
failure under a limit is reported as a failure with the cost of the cheapest route. Covered for
Eclair rebalances and for LND no-route failures; other payment paths and implementations are
not.

### NODE-001

Every request acts on the node selected in the caller's own session and carries that node's
credentials and options. A request for a different Lightning implementation than the selected
node is refused rather than sent to the node that happens to be active; overlapping sessions
keep their own settings, and unloading a node does not disturb another session's data.

## Coverage gaps to close next

- **AUTH-004** — add a test that drives session/cookie expiry through a node-facing route.
- **SEC-001** — add a response-level check that no secret value appears in API output or logs.
- **SEC-002** — add a per-route sample of state-changing endpoints beyond login and logout.
- **PAY-001** — assert displayed amount, fee and destination against the submitted payment, and
  that one confirmation cannot submit twice.
- **PAY-002 / PAY-003** — cover the LND, Eclair and (where applicable) CLN equivalents so the
  guarantees hold on all three backends.

See [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for the contribution process; behavior-changing
PRs should reference the invariant IDs they affect.
