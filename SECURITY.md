# Security Policy

RTL (Ride The Lightning) is a web interface for Lightning nodes. To do its job it holds
node credentials (LND macaroons, Core Lightning runes, Eclair API passwords), so a security
flaw in RTL could let an attacker act on the node it manages — including moving funds. We
therefore treat security reports seriously and ask that you report them privately.

**Please do not open a public GitHub issue for a security vulnerability.**

## Reporting a vulnerability

Use either channel:

1. **GitHub private vulnerability reporting (preferred):**
   <https://github.com/Ride-The-Lightning/RTL/security/advisories/new>.
   The report, the fix and any CVE are handled in the resulting private advisory thread.

2. **Email:** `security@ridethelightning.info` — put **`[RTL-SEC]`** at the start of the
   subject line. After first contact we will normally move the conversation into a private
   GitHub advisory.

   You can encrypt to the RTL release-signing key, which carries the
   `security@ridethelightning.info` identity:

   ```
   3E9B D443 6C28 8039 CA82 7A92 00C9 E2BC 2E45 666F
   ```

   Fetch it with `gpg --locate-key security@ridethelightning.info` (published on
   `keys.openpgp.org`). This is the same key that signs RTL release tags and archives, so you
   can also verify it against any past release. Please paste encrypted messages inline as an
   armored block rather than attaching them.

What to include: the RTL version (or commit), the Lightning implementation (LND / Core
Lightning / Eclair), how RTL is deployed (standalone, behind a reverse proxy, or bundled by a
distribution such as BTCPay Server, Umbrel, RaspiBlitz, Start9, myNode, Nodl), and steps to
reproduce.

**Please do not send attachments.** Paste a proof of concept inline or link a private gist.
Messages with attachments may be discarded unread.

## What to expect

- We will acknowledge your report within **72 hours** and aim to give an initial assessment
  within a week. RTL is maintained by a small team; if we are slow, a polite follow-up on the
  same thread is welcome.
- We will keep you informed as the fix progresses and credit you in the release notes and
  advisory unless you prefer otherwise.
- Because RTL is bundled by several downstream distributions, we may coordinate the release
  of a fix with them under embargo before publishing details. We ask reporters to allow up to
  90 days from acknowledgement for a fix to ship before disclosing publicly, and we will tell
  you if we need to ask for more time.
- **There is no bug bounty.** We do not pay for reports and will not respond to payment
  requests.
- Reports consisting of unverified scanner or AI/LLM output without a working reproduction
  will be closed without response.

## Scope

**In scope** — anything that lets an unauthenticated or lower-privileged party do what only
the authenticated node operator should:

- authentication or session bypass, including the 2FA and SSO (one-time cookie) flows
- CSRF or other cross-origin abuse of RTL's API
- exposure of node credentials (macaroons, runes, API passwords, config file contents,
  backups) through the API, the UI, logs or error messages
- config-file handling that lets an API caller read or write files RTL should not
- path traversal, injection, or cross-site scripting in the RTL UI or backend
- anything that lets RTL send funds, close channels or change node settings without the
  operator's action

**Out of scope** — by design or by deployment, not a vulnerability in RTL:

- **`disableAuth`**: RTL can be configured with authentication turned off for vendors that
  front it with their own authentication. With this option the vendor is responsible for
  access control; "RTL is reachable without a password" in such a deployment is not a report.
- **Plain HTTP**: RTL serves HTTP and expects TLS to be terminated by a reverse proxy or a
  distribution's own stack (see the README's SSL and Tor guides). Reports that RTL "does not
  use HTTPS" are not actionable.
- **The `docker/` directory** is a self-contained regtest fixture for development and testing.
  Every credential, macaroon, rune, password and key in it is throwaway and intentionally
  committed. Secret-scanner hits on that directory are not vulnerabilities.
- Vulnerabilities in the Lightning implementations themselves (LND, Core Lightning, Eclair),
  in Bitcoin Core, or in downstream distributions' packaging — please report those to the
  respective projects. If you are unsure whether the issue is in RTL or in a bundle that
  includes it, report to us and we will help route it.
- Denial of service that requires authenticated operator access, and issues that require a
  compromised operator machine or browser.

## Supported versions

Only the **latest release** receives security fixes. RTL has a single release line and no
backport branches; fixes ship in the next release (or a point release for severe issues) and
downstream distributions pick them up from there. If you run RTL through a distribution,
its update channel is how you receive fixes.

## Thank you

Responsible reports have made RTL safer for everyone who runs a Lightning node with it. If
you have found something, we would rather hear about it than not — even if you are not sure
it qualifies.
