/**
 * Deterministic screenshot capture of RTL against the regtest fixture.
 *
 * The point of this script is that the capture conditions live in code rather
 * than in someone's memory. Viewport, device scale factor, browser and the
 * screen list are all pinned here, so a capture taken today and one taken after
 * a redesign differ only by the design.
 *
 * Requires the fixture to be running (see ../README.md).
 *
 *   node capture.mjs empty     # BEFORE ./scripts/seed.sh -- empty states
 *   node capture.mjs full      # AFTER  ./scripts/seed.sh -- populated
 *
 * Every route below was verified against a running RTL by checking page content,
 * not just the URL: Angular renders its 404 component without changing the URL,
 * so a path can look fine and be a "Page Not Found".
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

// --- capture conditions. Record these in baseline/README.md. -----------------
const BASE = 'http://localhost:3000';
const PASSWORD = 'rtldev';          // must match multiPass in rtl/RTL-Config.regtest.json
const VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const SCALE = 2;                    // Retina. 1440x900 CSS px -> 2880x1800 file.
const OUT = process.env.OUT_DIR || './shots';
const SETTLE_MS = 1200;             // let charts and tables finish rendering

// --- shot lists --------------------------------------------------------------
// node: which LND node to view. null = whatever is selected (login screen).

const EMPTY = [
  { file: 'lnd-login.png',                    route: '/rtl/login',                         node: null, noAuth: true },
  { file: 'lnd-dashboard-operator-empty.png', route: '/rtl/lnd/home',                      node: 'alice' },
  { file: 'lnd-channels-empty.png',           route: '/rtl/lnd/connections/channels/open', node: 'alice' },
  { file: 'lnd-peers-empty.png',              route: '/rtl/lnd/connections/peers',         node: 'alice' },
  { file: 'lnd-payments-empty.png',           route: '/rtl/lnd/transactions/payments',     node: 'alice' },
  { file: 'lnd-invoices-empty.png',           route: '/rtl/lnd/transactions/invoices',     node: 'alice' },
];

const FULL = [
  { file: 'lnd-dashboard-operator-day.png',   route: '/rtl/lnd/home',                          node: 'alice' },
  { file: 'lnd-dashboard-merchant-day.png',   route: '/rtl/lnd/home',                          node: 'carol' },
  { file: 'lnd-dashboard-routing-day.png',    route: '/rtl/lnd/home',                          node: 'bob'   },
  { file: 'lnd-channels-open.png',            route: '/rtl/lnd/connections/channels/open',     node: 'alice' },
  { file: 'lnd-channels-open-routing.png',    route: '/rtl/lnd/connections/channels/open',     node: 'bob'   },
  { file: 'lnd-channels-pending.png',         route: '/rtl/lnd/connections/channels/pending',  node: 'alice' },
  { file: 'lnd-channels-closed.png',          route: '/rtl/lnd/connections/channels/closed',   node: 'alice' },
  { file: 'lnd-peers.png',                    route: '/rtl/lnd/connections/peers',             node: 'bob'   },
  { file: 'lnd-payments.png',                 route: '/rtl/lnd/transactions/payments',         node: 'alice' },
  { file: 'lnd-invoices.png',                 route: '/rtl/lnd/transactions/invoices',         node: 'carol' },
  { file: 'lnd-onchain-receive.png',          route: '/rtl/lnd/onchain/receive/0',             node: 'alice' },
  { file: 'lnd-onchain-send.png',             route: '/rtl/lnd/onchain/send/0',                node: 'alice' },
  { file: 'lnd-routing-forwardinghistory.png',route: '/rtl/lnd/routing/forwardinghistory',     node: 'bob'   },
  { file: 'lnd-routing-peers.png',            route: '/rtl/lnd/routing/peers',                 node: 'bob'   },
  { file: 'lnd-reports-routing.png',          route: '/rtl/lnd/reports/routingreport',         node: 'bob'   },
  { file: 'lnd-reports-transactions.png',     route: '/rtl/lnd/reports/transactions',          node: 'alice' },
  { file: 'lnd-graph-queryroutes.png',        route: '/rtl/lnd/graph/queryroutes',             node: 'alice' },
  { file: 'lnd-graph-lookups.png',            route: '/rtl/lnd/graph/lookups',                 node: 'alice' },
  { file: 'lnd-network.png',                  route: '/rtl/lnd/network',                       node: 'alice' },
  { file: 'lnd-wallet.png',                   route: '/rtl/lnd/wallet',                        node: 'alice' },
  { file: 'lnd-messages-sign.png',            route: '/rtl/lnd/messages/sign',                 node: 'alice' },
  { file: 'lnd-messages-verify.png',          route: '/rtl/lnd/messages/verify',               node: 'alice' },
  { file: 'lnd-channelbackup.png',            route: '/rtl/lnd/channelbackup/bckup',           node: 'alice' },
  { file: 'lnd-settings-app.png',             route: '/rtl/settings/app',                      node: 'alice' },
  { file: 'lnd-settings-auth.png',            route: '/rtl/settings/auth',                     node: 'alice' },
  { file: 'lnd-settings-nodeconfig.png',      route: '/rtl/settings/bconfig',                  node: 'alice' },
  // Loop and Boltz are NOT configured in this fixture, so these record the
  // unconfigured state. That is what most RTL users see, but it is not
  // comparable to the lnd/loop and lnd/swapservices mockups, which assumed a
  // configured service. Note this in baseline/README.md.
  { file: 'lnd-services-loop-unconfigured.png',  route: '/rtl/services/loop/loopout',  node: 'alice' },
  { file: 'lnd-services-boltz-unconfigured.png', route: '/rtl/services/boltz/swapout', node: 'alice' },
];

// --- helpers -----------------------------------------------------------------

const log = (m) => console.log(`  ${m}`);

async function login(page) {
  await page.goto(`${BASE}/rtl/login`, { waitUntil: 'networkidle' });
  await page.fill('input#password', PASSWORD);
  await page.click('button[type=submit]');
  // RTL forces a password change for blacklisted passwords ('password',
  // 'changeme', 'moneyprintergobrrr') and parks on /rtl/settings/auth.
  await page.waitForURL('**/lnd/home', { timeout: 20000 }).catch(() => {
    throw new Error(
      `login did not reach the dashboard (landed on ${page.url()}).\n` +
      `    If this is /rtl/settings/auth, the password is blacklisted by RTL.`
    );
  });
  await page.waitForTimeout(SETTLE_MS);
}

/** Switch the active node via the sidebar selector. */
async function selectNode(page, name) {
  const select = page.locator('mat-select').first();
  const current = (await select.innerText()).trim();
  if (current.startsWith(name)) return;
  await select.click();
  // hasText is a case-insensitive substring match, which matters: mat-option's
  // text carries surrounding whitespace, so an anchored /^name/ regex misses.
  const option = page.locator('mat-option').filter({ hasText: `${name} (LND)` }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  await page.waitForTimeout(SETTLE_MS);
}

async function shot(page, { file, route, node, noAuth }) {
  if (node) await selectNode(page, node);
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);

  const body = await page.locator('body').innerText();
  if (/Page Not Found|does not exist/i.test(body)) {
    log(`SKIP ${file}  (route 404s: ${route})`);
    return false;
  }
  await page.screenshot({ path: `${OUT}/${file}`, fullPage: false });
  log(`${file}${node ? `  [${node}]` : ''}`);
  return true;
}

// --- main --------------------------------------------------------------------

const phase = process.argv[2];
if (!['empty', 'full'].includes(phase)) {
  console.error('usage: node capture.mjs <empty|full>');
  console.error('  empty  run BEFORE ./scripts/seed.sh');
  console.error('  full   run AFTER  ./scripts/seed.sh');
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: SCALE });
const page = await context.newPage();

console.log(`\nCapturing "${phase}" -> ${OUT}  (${VIEWPORT.width}x${VIEWPORT.height} @${SCALE}x)\n`);

const shots = phase === 'empty' ? EMPTY : FULL;
let ok = 0, skipped = 0;

// The login screen is the only shot taken before authenticating.
const pre = shots.filter((s) => s.noAuth);
for (const s of pre) {
  await page.goto(BASE + s.route, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: `${OUT}/${s.file}` });
  log(s.file);
  ok++;
}

await login(page);
for (const s of shots.filter((s) => !s.noAuth)) {
  (await shot(page, s)) ? ok++ : skipped++;
}

// Mobile, dashboard only. The readme claims RTL is "device agnostic".
if (phase === 'full') {
  const mob = await browser.newContext({ viewport: MOBILE_VIEWPORT, deviceScaleFactor: SCALE, isMobile: true, hasTouch: true });
  const mp = await mob.newPage();
  await login(mp);
  await mp.goto(`${BASE}/rtl/lnd/home`, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(SETTLE_MS);
  await mp.screenshot({ path: `${OUT}/lnd-dashboard-operator-mobile.png` });
  log(`lnd-dashboard-operator-mobile.png  [${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}]`);
  ok++;
  await mob.close();
}

await browser.close();
console.log(`\n${ok} captured, ${skipped} skipped -> ${OUT}\n`);
