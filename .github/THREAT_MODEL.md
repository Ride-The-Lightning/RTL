# RTL threat model

Vulnerability reports go through `SECURITY.md`, not this file.

## What RTL protects

1. **Node credentials** held by the backend: LND macaroons, Core Lightning runes, Eclair
   API passwords and the Loop macaroon. Whoever holds them can move funds.
2. **The ability to act on the node** through RTL's API: payments, channel opens and
   closes, on-chain sends, Loop swaps, backups and restores.
3. **RTL's own secrets**: the login password hash (`multiPassHashed`), the 2FA secret,
   `secret_key` (64 random bytes generated at each start; signs JWTs, the session cookie
   and the CSRF cookie), and the SSO cookie file.
4. **The session in the browser**: the JWT in `sessionStorage`. Whoever reads it can act
   on the node.
5. **Node privacy**: balances, channels, peers, payment and invoice history.
6. **`RTL-Config.json`** and the node config files RTL can read.
7. **What RTL ships**: the committed `frontend/` and `backend/` and the dependencies inside
   them, which run in the operator's browser and on the RTL host.

RTL's availability ranks below these: the node keeps running, and keeps the funds, while
RTL is down. A crash that an unauthenticated client can cause at will is still in scope.

## Actors

| Actor | In scope | Notes |
|---|---|---|
| Unauthenticated network client that can reach RTL's port | yes | RTL is often exposed over a LAN, Tor or a reverse proxy |
| Malicious web page open in the operator's browser | yes | CSRF, cross-origin reads, WebSocket hijacking |
| Remote Lightning peer or payer | yes | Controls aliases, invoice memos, error strings and other fields RTL renders |
| Third-party service RTL queries (block explorer, rate service) | yes | Its replies are untrusted data; on-chain sends convert fiat amounts with its rates |
| Authenticated RTL user | partly | Is the node operator and may do anything the node allows; must not reach files or hosts outside what RTL is configured for. One login covers every configured node, with no roles |
| Contributor submitting a PR | yes | Source changes, and committed `frontend/` / `backend/` output that may not match source |
| Compromised or malicious npm dependency | yes | Handled by dependency policy, not by code review of the diff |
| Network observer between the browser and RTL | no | TLS is the operator's deployment choice (reverse proxy, Tor); RTL does not defend a plain-HTTP link |
| Network path between RTL and the node | no | RTL does not verify the node's TLS certificate, so that path must be trusted |
| Someone with shell or file access on the RTL host | no | They can already read the credentials |
| A malicious browser extension, or someone at the operator's unlocked browser | no | They can already read the session |
| The Lightning node itself and bitcoind | no | Trusted backends |
| The reverse proxy or bundling distribution (BTCPay Server, Umbrel and others) | no | Trusted, but RTL must work correctly under a sub-path and with their SSO |

## Entry points

- **HTTP API** under `<baseHref>/api`, mounted in `server/utils/app.ts`:
  - Public: `POST /authenticate`, `POST /authenticate/logout`, `GET /conf`,
    `GET /conf/rates`.
  - Everything else, including all of `/api/lnd`, `/api/cln` and `/api/ecl`, requires a
    valid JWT (`isAuthenticated` in `server/utils/authCheck.ts`).
  - Every request other than GET, HEAD and OPTIONS, public or not, also needs a CSRF token
    (`csrf-csrf`, mounted for all paths in `server/utils/csrf.ts`).
- **WebSocket** at `<baseHref>/api/ws`, verified by `verifyWSUser` (JWT plus CSRF). The
  JWT is the first `Sec-WebSocket-Protocol` value and the node index the second. `Origin` is
  not checked; a cross-site page fails because it cannot read the JWT.
- **Login**: password, optional TOTP, and per-IP failed-attempt tracking in
  `server/controllers/shared/authenticate.ts`. Five failures lock an address for 30 minutes.
  The address is `req.ip`, which honours `X-Forwarded-For` only from `trustedProxies`.
- **SSO**: when `rtlSSO` is set, login accepts the value of a rotating cookie file. The
  `/api/authenticate/cookie` URL is not a route and reaches the catch-all in `app.ts`.
- **Static files and the catch-all**, which serve `frontend/` and mint `XSRF-TOKEN`.
- **Settings writes**: `POST /conf/application` and `POST /conf/node` write
  `RTL-Config.json`. They keep only the allow-listed keys in
  `server/controllers/shared/RTLConf.ts`; server URLs, credential paths and
  `blockExplorerUrl` are not among them.
- **Data from the node shown in the UI**: anything a peer or payer chose. Interpolation
  escapes it. The HTML sinks are `[innerHTML]` in the alert and confirmation modals
  (`ARRAY` fields, which do carry node data, sanitised by Angular), the help page and the
  currency symbols (constants, passed through `bypassSecurityTrustHtml`).
- **Links the UI opens**: block explorer and node-directory URLs built from a txid,
  channel point or node id.
- **Input the operator pastes or scans**: invoices, offers, node URIs, addresses.
- **WebSocket messages** the Angular client receives and puts in the store.
- **Outbound requests** RTL makes: the node's REST or WebSocket API, the Loop server, the
  configured block explorer (falling back to `mempool.space`) and `blockchain.info` for
  currency rates. HTTP calls go through `server/utils/request.ts`, with a 10-minute default
  timeout.
- **Config and file reads/writes** in `server/controllers/shared/RTLConf.ts`.
  `GET /conf/file` reads only under the node's `channelBackupPath`;
  `GET /conf/config/:nodeType` reads only the paths configured for the node.
- **The repository itself**: committed `frontend/` and `backend/` run on a git install
  without being rebuilt, and `npm ci` runs dependency install scripts on developer and CI
  machines.

## Trust boundaries

1. Browser to RTL backend: nothing from the request is trusted before the JWT and CSRF
   checks pass.
2. RTL backend to node: the backend attaches the credential; the browser never sees it.
   Upstream errors reach the browser only through `common.handleError`, which strips the
   credential headers.
3. Node data to the Angular templates: peer-controlled strings are untrusted on display
   and never bypass Angular's sanitiser.
4. Node data to URLs the browser opens: it may fill a path, never choose the origin.
5. Request input to the filesystem and to outbound URLs: a path stays inside its configured
   directory, a value in an upstream URL stays one path segment, and the host comes from
   config.
6. Request input to `RTL-Config.json`: only allow-listed keys are persisted.
7. Third-party replies to the backend and UI: block-explorer and rate replies are
   untrusted data, and `usableRates` passes on only finite, positive currency rates.
8. Source to committed build output.

Route guards and form validation in the Angular app run on the untrusted side of boundary
1. They are usability, and every rule they express is enforced again by the backend.

## Threats and the controls that answer them

| Threat | Actor | Control |
|---|---|---|
| Guessing the password or 2FA code | Unauthenticated client | Lockout per address; `trust proxy` limited to `trustedProxies`, so the address cannot be forged (#1656); one error message for a wrong password and a wrong code; TOTP accepts one 30-second step either side |
| Filling the lockout table | Unauthenticated client | Bounded at 1,000 addresses; a live lockout is evicted last |
| Forging a session token | Unauthenticated client | JWTs are HMAC-signed with `secret_key`; unsigned tokens are refused |
| Request forgery | Malicious page | The page cannot read the JWT from RTL's `sessionStorage`; `csrf-csrf` double-submit on every non-GET request, with the `_csrf` cookie `SameSite=Strict`; logout is a POST |
| WebSocket hijacking | Malicious page | `verifyWSUser` requires the JWT and the CSRF token |
| Script injection | Peer or payer | Angular escaping; `[innerHTML]` stays behind the sanitiser; `bypassSecurityTrust*` takes only constants |
| A link to an attacker's site | Peer or payer | Links have a fixed origin or the configured `blockExplorerUrl`, and open with `noopener,noreferrer` |
| Sending a credential to another host | Authenticated user | Server URLs, credential paths and `blockExplorerUrl` are config-only; the settings endpoints are allow-listed |
| Changing which upstream endpoint a call reaches | Authenticated user | Path values are checked for their form or `encodeURIComponent`-encoded |
| Reading files outside RTL's scope | Authenticated user | `getFile` is confined to `channelBackupPath`; `getConfig` reads configured paths only |
| A credential in a reply or log | Any | `handleError`, `removeSecureData`, `removeAuthSecureData` and `maskPasswords`; `GET /conf` returns no secrets |
| A tampered bundle | Contributor | `checks.yml` rebuilds both artifacts and fails on a difference; maintainers regenerate them before merging |
| A malicious dependency | Supply chain | Exact versions, committed lockfile, `npm ci`, an issue before any new dependency, batched Dependabot updates, no `npm audit fix` |

## What a security finding must show

Besides the actor and entry point, the protected item it reaches and, if it defeats a
control in the table above, that control.

## Known accepted behaviour

- The session and CSRF cookies are not marked `secure`, because RTL is commonly served
  over plain HTTP on a LAN or behind a TLS-terminating proxy.
- The session cookie keeps the default name `connect.sid` and has no `SameSite` attribute.
  It holds the selected node and binds the CSRF token; it does not log anyone in.
- With `NODE_ENV` set to `development`, RTL sends permissive CORS headers and turns off the
  CSRF check and WebSocket verification. That mode is for local development only.
- The JWT is kept in `sessionStorage`, readable by any script running in RTL's origin, so
  an XSS is a session takeover.
- RTL sets no HSTS header, because TLS is the reverse proxy's, and no `X-Frame-Options`: a
  cross-site frame is not sent the `SameSite=Strict` CSRF cookie, so it cannot change state.
- The browser sends the SHA-256 of the password, not the password. That hash is the login
  secret on the wire and does not replace TLS.
- RTL does not verify the TLS certificate of the node or the Loop server
  (`rejectUnauthorized: false`), because nodes commonly use self-signed certificates.
- Login is the only rate-limited route. Every other route needs the JWT.
- The WebSocket server keeps the `ws` default `maxPayload`.
