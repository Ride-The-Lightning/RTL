<!-- Target the current Release-x.y.z branch, not master. See CONTRIBUTING.md. -->

## What and why

<!-- What this changes and the issue it addresses (Fixes #N). For a bug fix, state the root cause. -->

## Testing

<!-- What you ran and what you saw: lint, test, `npm run check`, the docker fixture.
     If the change alters what a user sees, before and after screenshots of the same screen;
     if it is a frontend change with nothing visible to show, say so.
     For auth, CSRF, cookie or static-serving changes, the result of docker/scripts/verify-sso.sh. -->

## Risk

<!-- What could break, and for whom: which implementation (LND / CLN / Eclair), which setups
     (standalone, reverse proxy, bundled with SSO), and whether an upgrade from the previous
     release needs anything. Say "low" and why if that is the case. -->

## Checklist

- [ ] `npm run lint`, `npm run test` and `npm run check` pass locally
- [ ] `backend/` and `frontend/` are rebuilt if `server/` or `src/` changed
- [ ] The same change is made in the other two implementations, or the PR says why not
- [ ] Before and after screenshots are posted if the change alters what a user sees
- [ ] Release note added in `release-notes/`
