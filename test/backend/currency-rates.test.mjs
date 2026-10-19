import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import axios from 'axios';

import { getCurrencyRates } from '../../backend/controllers/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';

// On-chain sends convert a fiat amount with these rates, so the endpoint passes on only rates that
// can convert one: a finite, positive `last`. The rates come from a third party (blockchain.info).

const NODE = { index: 0, lnNode: 'lnd-main', lnImplementation: 'LND', authentication: { options: {} }, settings: { logLevel: 'ERROR' } };
const originalRequest = axios.request;
const originalNode = Common.selectedNode;
afterEach(() => {
  axios.request = originalRequest;
  Common.selectedNode = originalNode;
});

const ratesReplying = async (reply) => {
  Common.selectedNode = NODE;
  axios.request = async () => ({ data: typeof reply === 'string' ? reply : JSON.stringify(reply) });
  const res = { statusCode: null, body: null };
  await new Promise((resolve) => {
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (payload) => { res.body = payload; resolve(); return res; };
    getCurrencyRates({ session: { selectedNode: NODE } }, res, null);
  });
  return res;
};

test('getCurrencyRates passes on rates that can convert an amount', async () => {
  const res = await ratesReplying({ USD: { last: 81525, symbol: '$' }, EUR: { last: 75000.5, symbol: '€' } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { USD: { last: 81525, symbol: '$' }, EUR: { last: 75000.5, symbol: '€' } });
});

test('getCurrencyRates leaves out a rate without a finite, positive last', async () => {
  const res = await ratesReplying({ USD: { last: 81525, symbol: '$' }, EUR: { last: 0, symbol: '€' }, GBP: { last: -5 }, JPY: { last: '12000000' }, CHF: { symbol: 'CHF' }, CAD: null });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(Object.keys(res.body), ['USD']);
});

for (const [what, reply] of [['no usable rate', { USD: { last: 'NaN' } }], ['a list', [{ last: 1 }]], ['text that is not JSON', 'Service Unavailable']]) {
  test(`getCurrencyRates answers an error when the rates reply has ${what}`, async () => {
    const res = await ratesReplying(reply);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.USD, undefined);
  });
}
