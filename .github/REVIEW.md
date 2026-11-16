# Review instructions for RTL

Instructions for reviewers of RTL pull requests, human or automated. `CONTRIBUTING.md` covers
process and `CLAUDE.md` covers working in the tree; this file covers only what to check in a
diff.

Apply "Every PR" always, and the `server/` or `src/` section when the diff touches that tree.

## Every PR

- **Scope.** The PR does one thing. It carries no unrelated reformatting, renames or
  commented-out code, and no `debugger`, `fdescribe`/`fit` or `xdescribe`/`xit`: a focused
  spec makes Karma skip the rest of the suite without failing.
- **Generated output matches source.** A change under `server/` comes with the regenerated
  `backend/` files in the same PR, and `backend/` changes nothing that `server/` does not
  explain. Review `server/`; read `backend/` only to confirm it corresponds.
- **Both sides of an API change.** A request or response shape changed in `server/` is
  matched in the `src/app` service, effect and model that use it, and the reverse.
- **Every other use of what changed.** A PR that changes how something is named, scoped or
  shaped (a cookie's name or attributes, a `sessionStorage` key, a route path, a config key,
  a database field) updates every place that sets, reads and deletes it, and its description
  lists them, since the diff shows only the files it touched. #1785 scoped the cookies to
  `baseHref` where they are set (`app.ts`, `csrf.ts`) but not where logout clears them
  (`authenticate.ts`), so logout stopped clearing them (#1795).
- **Upgrades.** The change works for an install coming from the previous release without
  manual steps: its `RTL-Config.json`, its database files, the cookies and `sessionStorage`
  a browser still holds, and a bundle serving RTL under `/rtl` with SSO.
- **Config keys.** A new or renamed `RTL-Config.json` key or environment variable has a
  default that keeps an existing install working, and is added to `Sample-RTL-Config.json`
  and `.github/docs/Application_configurations.md`.
- **Dependencies.** A new or bumped dependency is justified in the PR and was discussed in
  an issue first. Versions stay exact (no `^` or `~`). `package-lock.json` changes only as
  far as `package.json` explains, and every `resolved` URL stays on `registry.npmjs.org`.
  A change to `overrides` names the advisory or conflict it resolves. `@angular/*`,
  `@angular/cdk` with `@angular/material`, and `@angular-eslint/*` each move as a set.
  `npm audit fix` output is not acceptable.
- **Release note.** `release-notes/Release-notes-<x.y.z>.md` has an entry under the right
  heading, linking the PR and issue and stating the root cause.
- **Base branch.** The PR targets the current `Release-x.y.z` branch, not `master`.

## Server (`server/`)

- **Every new or changed route is authenticated.** All routes under `server/routes/` use
  `isAuthenticated` except `POST /authenticate`, `POST /authenticate/logout`,
  `GET /conf` and `GET /conf/rates`. A new exception needs a stated reason.
- **State changes are not GETs.** A route that changes node, config or session state uses
  POST, PUT, PATCH or DELETE: `csrf-csrf` does not check GET, HEAD or OPTIONS.
- **Unauthenticated responses carry no secrets.** `GET /conf` is public: nothing it returns
  may include a node credential, a password, the 2FA secret or `secret_key`.
- **Node credentials stay on the server.** A config or node object that goes to the browser
  or a log passes through `removeSecureData`, `removeAuthSecureData` or `maskPasswords` in
  `server/utils/common.ts`, which strip macaroons, runes and the Eclair password.
- **Errors.** A controller catches its own failures and replies with what
  `common.handleError` returns, which strips the macaroon, rune and Eclair authorization
  headers and keeps file paths out of the reply. An uncaught throw or rejection reaches the
  catch-all handler in `app.ts`, which answers 400 with the whole serialised error.
- **Upstream URLs.** A request value placed in a node, Loop or block-explorer URL is checked
  for its expected form (pubkey, txid, payment hash, channel point) or passed through
  `encodeURIComponent`. Express has already decoded it, so a `/`, `..` or `?` in it would
  reach a different upstream endpoint (`test/backend/lnd-path-params.test.mjs`).
- **Outbound hosts and credential paths come from config.** The LN server URL, the Loop
  server URL, macaroon and rune paths and `blockExplorerUrl` are set in `RTL-Config.json` or
  the environment, never by a request. The settings endpoints persist only the keys in
  `NODE_SETTINGS_ALLOWLIST`, `NODE_ALLOWLIST` and `TOP_LEVEL_ALLOWLIST` in
  `server/controllers/shared/RTLConf.ts`; a new entry there that holds a URL, host or file
  path lets a session redirect a credential or a file read.
- **Outbound requests** go through `server/utils/request.ts`, which applies a 10-minute
  default timeout; a call removes it only for a stream that must stay open.
  `rejectUnauthorized: false` is for the configured node and Loop server only; a call to a
  third-party host (block explorer, rate service) keeps certificate verification.
- **Auth, CSRF, cookies, static serving.** A change to `server/utils/app.ts`, `csrf.ts`,
  `authCheck.ts`, `cors.ts` or `controllers/shared/authenticate.ts` states that
  `docker/scripts/verify-sso.sh` was run, and keeps cookie paths on `baseHref`. `trust proxy`
  stays limited to `trustedProxies`: trusting every hop lets a client rotate
  `X-Forwarded-For` past the login lockout (#1656).
- **Tokens and secrets.** A JWT is signed and verified only with `common.secret_key`, and is
  minted only after the password, 2FA or SSO check passes; `jwt.decode` is never used for a
  decision. A new comparison of a password, access key or token uses `crypto.timingSafeEqual`
  after a length check, as `matchesSSOCookie` does. A new secret comes from
  `crypto.randomBytes`, never `Math.random()`.
- **File access.** Any path built from request input (`RTLConf.ts` file and config reads,
  backup and download paths) is confined to the configured directory: resolved with
  `path.resolve` and compared with the base plus a separator, as `getFile` does for
  `channelBackupPath`.
- **Writes to `RTL-Config.json`** go to a temp file created `0600` that is renamed over the
  original with the original's mode, as `updateApplicationSettings` does, so a failed write
  cannot truncate the file or widen its permissions.
- **WebSocket.** The upgrade stays behind `verifyWSUser` (the JWT in the first subprotocol,
  plus the CSRF check), and node events go only to clients watching that node.
- **Server-side validation.** Input is checked in the controller even when the Angular form
  already validates it; the browser is not trusted.
- **Backend fixes have a regression test** in `test/backend/`. A security fix also tests the
  refused case: no token, a bad CSRF token, a `../` path, a value that changes the upstream
  path.

## Frontend (`src/`)

- **HTML sinks.** A new `bypassSecurityTrust*` call is justified and takes only a constant
  shipped with RTL, as the currency symbols do. Values from a peer, invoice, alias, memo or
  node error string are never passed to it. The alert and confirmation modals render `ARRAY`
  fields through `[innerHTML]`, so node data does reach that sink and must stay behind the
  sanitiser.
- **Links and navigation.** `window.open` and `target="_blank"` keep `noopener,noreferrer`.
  A URL built from node or peer data has a fixed origin; only the configured
  `blockExplorerUrl` may supply one.
- **QR codes** (`ng-qrcode`) encode exactly the invoice, offer, address or node URI shown
  beside them.
- **Confirmation steps.** A PR keeps the confirmation before a payment, a channel open or
  close and an on-chain send, the password prompt (`isAuthorized`) before an LND or CLN
  on-chain send and before a node's config file is shown, and the idle logout
  (`provideUserIdleConfig` in `app.module.ts`).
- **Browser storage.** `sessionStorage` holds the JWT and UI flags, through
  `SessionService`. Nothing goes in `localStorage`, and no password, 2FA secret or node
  credential is stored there or kept in the NgRx store. `StoreDevtoolsModule` stays
  development-only.
- **Passwords.** A password is hashed with `sha256` before it is dispatched or sent (login,
  reset, `is-authorized`), and is never passed to `LoggerService` or `console`.
- **API calls use `HttpClient` and `API_URL`**, so `AuthInterceptor` adds the token and
  Angular adds the CSRF header. No `fetch` or `XMLHttpRequest`, and no request from the
  browser to a third-party host; rates and similar lookups go through the backend.
- **Routes.** A new route has `AuthGuard`. The guard is a convenience: the API route it
  calls must use `isAuthenticated`.
- **Sub-path serving.** Asset and API URLs stay relative, so RTL works under `/rtl` behind
  a reverse proxy.
- **Frontend fixes have a spec** (`*.spec.ts`) beside the component, service or effect.

## Do not flag

- Style or structure of `backend/` code. It is `tsc` output.
- Pre-existing patterns the PR merely follows, including the codebase's idioms: `any`,
  NgModule components with default change detection rather than standalone and `OnPush`,
  `*ngIf`/`*ngFor` rather than `@if`/`@for`, `fxLayout` directives, `mergeMap` in effects,
  `takeUntil(this.unSubs[n])` rather than `takeUntilDestroyed`. Moving off them is its own PR.
- `[innerHTML]` on `convertedCurrency.symbol` or `currencyUnit.symbol`. The symbols are
  constants in `consts-enums-functions.ts`.
- A missing client-side check where the server enforces the same rule.
- Anything listed under "Known accepted behaviour" in `.github/THREAT_MODEL.md`, unless the
  PR changes it.
- Per-user authorization, roles or ownership checks. RTL has one login for all of its nodes.
- `jwt.verify` without an `algorithms` option. With a string secret, `jsonwebtoken` 9
  accepts only HS256, HS384 and HS512 and refuses unsigned tokens.
- A control from a generic checklist that RTL does not use (`helmet`, a schema-validation
  library, an audit log) when no in-scope actor gains from its absence.
- The throwaway credentials under `docker/`. The fixture is dev-only.

## Severity

- Blocker: a CSRF or session check removed or bypassed, peer-controlled data passed to
  `bypassSecurityTrust*`.
- Major: `backend/` out of sync with `server/`, a path built from request input without
  confinement, a request value reaching an upstream URL unchecked, a password or secret in
  browser storage or a log, an upstream error sent to the browser without `handleError`, a
  link whose origin comes from node data, a changed name, scope or shape with a setter,
  reader or deleter left on the old one, a change that breaks an install upgrading from the
  previous release, `trust proxy` trusting more than `trustedProxies`,
  a secret compared with `===` or drawn from `Math.random()`, a confirmation or password
  prompt removed.
- Minor: missing release note, wrong base branch, a focused or skipped spec, unrelated
  reformatting, a config key missing from the sample config or the docs.
