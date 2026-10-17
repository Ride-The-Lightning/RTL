import { getCLNSweepBlocks, getCLNCloseTxid, getFeeLimitSat, getNoRouteMessage } from './consts-enums-functions';

describe('getCLNSweepBlocks', () => {
  const waiting = 'ONCHAIN:1 outputs unresolved: in 13 blocks will spend DELAYED_OUTPUT_TO_US (txid:2) using OUR_DELAYED_RETURN_TO_WALLET';

  it('should read the blocks remaining from the latest status entry', () => {
    expect(getCLNSweepBlocks(['ONCHAIN:Tracking our own unilateral close', waiting])).toBe(13);
  });

  it('should ignore an older countdown once the latest entry has moved on', () => {
    expect(getCLNSweepBlocks([waiting, 'ONCHAIN:1 outputs unresolved: waiting confirmation that we spent DELAYED_OUTPUT_TO_US (txid:2) using OUR_DELAYED_RETURN_TO_WALLET'])).toBeNull();
    expect(getCLNSweepBlocks([waiting, 'ONCHAIN:All outputs resolved: waiting 90 more blocks before forgetting channel'])).toBeNull();
  });

  it('should return null without a status', () => {
    expect(getCLNSweepBlocks(undefined)).toBeNull();
    expect(getCLNSweepBlocks([])).toBeNull();
    expect(getCLNSweepBlocks(['CHANNELD_NORMAL:Channel ready for use.'])).toBeNull();
  });
});

describe('getCLNCloseTxid', () => {
  const txid = 'dd'.repeat(32);

  it('should return scratch_txid for our own unilateral close and a mutual close', () => {
    expect(getCLNCloseTxid({ state: 'ONCHAIN', scratch_txid: txid, status: ['ONCHAIN:Tracking our own unilateral close'] })).toBe(txid);
    expect(getCLNCloseTxid({ state: 'ONCHAIN', scratch_txid: txid, status: ['ONCHAIN:Tracking mutual close transaction'] })).toBe(txid);
    expect(getCLNCloseTxid({ state: 'AWAITING_UNILATERAL', scratch_txid: txid, status: [] })).toBe(txid);
  });

  it('should return null when the peer broadcast the close, since scratch_txid is then our unused commitment', () => {
    expect(getCLNCloseTxid({ state: 'ONCHAIN', scratch_txid: txid, status: ['ONCHAIN:Tracking their unilateral close'] })).toBeNull();
    expect(getCLNCloseTxid({ state: 'ONCHAIN', scratch_txid: txid, status: ['ONCHAIN:Tracking their illegal close: taking all funds'] })).toBeNull();
  });

  // FUNDING_SPEND_SEEN comes before onchaind's 'Tracking ...' line, so status cannot yet say who broadcast the spend.
  it('should return null while the funding spend is seen but not yet attributed', () => {
    expect(getCLNCloseTxid({ state: 'FUNDING_SPEND_SEEN', scratch_txid: txid, status: [] })).toBeNull();
  });

  it('should return null before any close transaction exists', () => {
    expect(getCLNCloseTxid({ state: 'CHANNELD_NORMAL', scratch_txid: txid })).toBeNull();
    expect(getCLNCloseTxid({ state: 'CHANNELD_SHUTTING_DOWN', scratch_txid: txid })).toBeNull();
    expect(getCLNCloseTxid({ state: 'ONCHAIN' })).toBeNull();
  });
});

describe('getFeeLimitSat', () => {
  it('should allow the whole amount as the default fee limit for a payment of up to 100 sats', () => {
    expect(getFeeLimitSat('default', null, 1)).toBe(1);
    expect(getFeeLimitSat('default', null, 100)).toBe(100);
  });

  it('should allow 5% of the amount, rounded up, as the default fee limit above 100 sats', () => {
    expect(getFeeLimitSat('default', null, 101)).toBe(6);
    expect(getFeeLimitSat('default', null, 10000)).toBe(500);
    expect(getFeeLimitSat('default', null, 40000000)).toBe(2000000);
  });

  it('should use a fixed or percentage limit as entered', () => {
    expect(getFeeLimitSat('fixed', 1000, 10000)).toBe(1000);
    expect(getFeeLimitSat('percent', 1, 10000)).toBe(100);
  });
});

describe('getNoRouteMessage', () => {
  const raise = 'set a higher limit.';

  it('should name what the cheapest route costs when the server found it', () => {
    expect(getNoRouteMessage('No Route ', 500, 500000, true, raise)).toBe('Payment not sent. Nothing was paid. The cheapest route LND found costs 500,000 Sats in fees, ' +
      'more than the default max fee of 500 Sats. If you\'re willing to pay that fee, set a higher limit.');
  });

  it('should say the default fee limit stopped the payment when the route cost is unknown', () => {
    expect(getNoRouteMessage('No Route ', 1500, undefined, true, raise)).toBe('Payment not sent. Nothing was paid. Every route LND found would cost more than the default max fee of ' +
      '1,500 Sats, or didn\'t have enough liquidity. If you\'re willing to pay a higher fee, set a higher limit.');
  });

  it('should call a limit the operator set their own', () => {
    expect(getNoRouteMessage('No Route ', 1500, undefined, false, raise)).toContain('would cost more than your max fee of 1,500 Sats');
    expect(getNoRouteMessage('No Route ', 700, 500000, false, raise)).toContain('costs 500,000 Sats in fees, more than your max fee of 700 Sats');
  });

  it('should leave other errors, and a no-route error sent without a limit, unchanged', () => {
    expect(getNoRouteMessage('Insufficient Balance ', 1500, 500000, true, raise)).toBe('Insufficient Balance ');
    expect(getNoRouteMessage('No Route ', undefined, 500000, true, raise)).toBe('No Route ');
  });
});
