# RTL — notes for AI coding agents

RTL (Ride The Lightning) is a device-agnostic web UI for Lightning node operations:
an Angular single-page frontend plus a Node/Express backend, both TypeScript.

`CONTRIBUTING.md` is the process document — how to install, run the dev servers, package a
build, open a PR, add a library, and handle Dependabot. **Read it first.** This file covers
only the things that are easy to get wrong and aren't obvious from the tree.

## Source vs. generated — read this before editing anything

| Directory   | What it is                        | Edit it? |
|-------------|-----------------------------------|----------|
| `src/`      | Angular frontend source           | yes      |
| `server/`   | Express backend source            | yes      |
| `frontend/` | Built AOT bundle, **committed**   | never by hand |
| `backend/`  | Compiled `server/` output, **committed** | never by hand |

`frontend/` and `backend/` look like ignorable build artifacts, but they are tracked in git
and are expected to stay in sync with the sources. So a code change is a two-step edit:
change `src/`/`server/`, then rebuild and commit the regenerated output in the same PR.

```bash
npm run buildbackend     # tsc: server/ -> backend/
npm run buildfrontend    # ng build --configuration production: src/ -> frontend/
```

`backend/` is a plain `tsc` transpile of `server/`, so it changes only when `server/` does —
a dependency bump alone won't move it. `frontend/` is a bundle, so it also carries the app
version and any bundled dependency.

## The three-implementation pattern

RTL supports three Lightning implementations, and the layout mirrors that everywhere:

```
src/app/{lnd,cln,eclair,shared}/
server/controllers/{lnd,cln,eclair,shared}/
server/routes/{lnd,cln,eclair,shared}/
```

A feature or fix usually touches the matching folder in **each layer** for the
implementations it affects; genuinely cross-cutting logic belongs in `shared/`. When fixing a
bug in one implementation, check whether the same shape exists in the other two — they
frequently do, since the controllers were written in parallel.

## Commands, and where they bite

- **Install with `npm ci --legacy-peer-deps`**, not `npm install`. Plain `npm ci` fails on an
  `ERESOLVE` conflict from `@fortawesome/angular-fontawesome`.
- **`npm run server` only works on Windows** — it sets `NODE_ENV` with `set X=Y&&` syntax. On
  macOS/Linux use `npm run serverUbuntu`.
- **`npm run lint` and `npm run test` must both be green before a PR.**
- If lint reports hundreds of template "Parsing error" failures, look for a stale
  **`coverage/`** directory (git-ignored Karma output). The template linter walks its HTML
  report. Delete it and re-run.
- The repo README is at **`.github/README.md`** — there is none at the root.

## Branches and releases

- **PRs target the current `Release-x.y.z` branch, not `master`.** Because release branches
  merge into `master` by *rebase*, a `Fixes #N` reference never auto-closes its issue (GitHub
  only does that for the default branch) — close it manually after the merge.
- **Every PR adds its own release-note entry**, in the same PR as the change:
  `release-notes/Release-notes-<x.y.z>.md`, under `## Bug Fixes`, `## Enhancements`,
  `## Code Health` or `## Developer Tooling`. Create the file if it doesn't exist yet.
  Link the PR and any issue, and state the root cause briefly. Because the PR number isn't
  known until the PR exists, commit the entry with `#TBD` and follow up with a
  `Fill in PR number in release note (#N)` commit.

### If a release ships while your PR is open

The rebase-merge rewrites every commit of the release branch to a new hash, and the next
release branch is cut from `master` — so a branch based on the old release branch shares no
recent ancestor with the new one. Retargeting it makes the merge base collapse to before the
release cycle, and GitHub replays the entire cycle into your PR: hundreds of files, and a
`CONFLICTING` state. Replay just your own commits instead:

```bash
git rebase --onto Release-<new> Release-<old> <your-branch>
```

Then confirm `git diff Release-<old>..<old-head>` is identical to
`git diff Release-<new>..<new-head>` before force-pushing. Retargeting *before* the release
branch is merged avoids the problem entirely.

## Testing against real nodes

`docker/` is a self-contained regtest fixture — bitcoind, three LND nodes, Core Lightning and
Eclair, wired to RTL — for end-to-end testing across all three implementations. See
`docker/README.md`, or the `rtl-docker-fixture` skill in `.claude/skills/`. It is dev-only;
every credential in it is throwaway.

The fixture also carries a **BTCPay Server SSO harness** behind a compose profile
(`docker compose --profile sso up -d`). BTCPay bundles RTL and reaches it over a path the
standalone login never exercises: a rotating cookie file, an unregistered
`/rtl/api/authenticate/cookie` URL that is not a route at all and falls through to the
catch-all in `server/utils/app.ts`, and a reverse proxy serving it under `/rtl`. Run
`docker/scripts/verify-sso.sh` (11 assertions, exits non-zero) after touching
authentication, CSRF or static serving — none of that path is covered by logging into the
fixture's own RTL. One trap it encodes: `GET /rtl/` is served by `express.static`, which
sits above the catch-all and mints no `XSRF-TOKEN`, so a client entering there gets a 403
on its first POST. That is long-standing behaviour, not a regression.

Backend regression tests live in `test/backend/` (plain `node:test`, run against the
compiled `backend/`). `npm run test` compiles the backend, then runs them
(`npm run testbackend`) before the frontend Karma/Jasmine specs, so they never test stale
code. For backend changes, also verify against the fixture and say so in the PR.

## Conventions

- **Be conservative about dependencies.** This is security-sensitive software. Prefer what's
  already there, and raise an issue before adding anything. Never run `npm audit fix` — it
  reaches for breaking major bumps. Dependabot PRs are batched, not merged individually; see
  `CONTRIBUTING.md`.
- Match the surrounding code's style, naming and structure. Only fix style in code you're
  already changing.
- `RTL-Config.json` is local runtime config and git-ignored; `Sample-RTL-Config.json` is the
  template, and `RTL.conf` is an alternate config format.
