# Baseline screenshot capture

Drives RTL against the regtest fixture and captures a fixed set of screens.

The point is that the capture conditions live in code rather than in someone's
memory: viewport, device scale factor, browser and screen list are all pinned in
`capture.mjs`. A capture taken today and one taken after a redesign differ only
by the design.

## Use

The fixture must be running (see `../README.md`).

```bash
npm install
npx playwright install chromium

# empty states -- BEFORE seeding
cd .. && docker compose down -v && docker compose up -d && cd capture
node capture.mjs empty

# populated -- AFTER seeding
cd .. && ./scripts/seed.sh && cd capture
node capture.mjs full
```

Output goes to `./shots` (gitignored). Screenshots belong in the RTL-Design
repo under `baseline/`:

```bash
OUT_DIR=/path/to/RTL-Design/baseline node capture.mjs full
```

## Conditions

| | |
|---|---|
| Viewport | 1440×900 (mobile 390×844) |
| Device scale factor | 2 — so files are 2880×1800 |
| Browser | Chromium via Playwright |
| Password | `rtldev` (must match `multiPass` in `../rtl/RTL-Config.regtest.json`) |

Record these in `baseline/README.md` in the design repo. Device scale factor
especially: re-shooting at a different ratio makes before/after comparisons
invalid, and nobody remembers it a year later.

## Notes

- Routes were verified against a running RTL by checking page content, not the
  URL. Angular renders its 404 component without changing the URL, so a route
  can look fine and be a "Page Not Found".
- The password must not be one of RTL's blacklisted weak passwords
  (`password`, `changeme`, `moneyprintergobrrr`) or login is redirected to a
  forced password change and never reaches the dashboard.
- Loop and Boltz are not configured in the fixture, so those shots record the
  unconfigured state.
