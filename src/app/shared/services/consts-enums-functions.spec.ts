import { getCLNFeeRatePerKb, getCLNSweepBlocks, getCLNCloseTxid, getFeeLimitSat, getNoRouteMessage, getLNDTxidBytes, msatToSat, msatToSatIfPresent, getDayOfMonthIndex } from './consts-enums-functions';

describe('getDayOfMonthIndex (#1331)', () => {
  const seconds = (date: Date) => date.getTime() / 1000;

  // Every local day of 2025, at its first and last second: a daylight-saving change must not move either.
  it('should give the local day of the month, less one, at both ends of every day of a year', () => {
    for (let day = new Date(2025, 0, 1); day.getFullYear() === 2025; day = new Date(2025, day.getMonth(), day.getDate() + 1)) {
      const first = new Date(2025, day.getMonth(), day.getDate(), 0, 0, 0);
      const last = new Date(2025, day.getMonth(), day.getDate(), 23, 59, 59);
      expect([day.toDateString(), getDayOfMonthIndex(seconds(first)), getDayOfMonthIndex(seconds(last))]).toEqual([day.toDateString(), day.getDate() - 1, day.getDate() - 1]);
    }
  });

  it('should read seconds given as a string or with a fraction', () => {
    const at = new Date(2025, 9, 31, 23, 30, 0);
    expect(getDayOfMonthIndex(seconds(at).toString())).toBe(30);
    expect(getDayOfMonthIndex(seconds(at) + 0.25)).toBe(30);
  });
});

describe('msatToSat (#468)', () => {
  it('should keep the mSat part as decimals', () => {
    expect(msatToSat(27552)).toBe(27.552);
    expect(msatToSat('27552')).toBe(27.552);
    expect(msatToSat('1000')).toBe(1);
    expect(msatToSat(1)).toBe(0.001);
  });

  it('should read a missing or unreadable amount as zero', () => {
    expect(msatToSat(undefined)).toBe(0);
    expect(msatToSat(null)).toBe(0);
    expect(msatToSat('')).toBe(0);
    expect(msatToSat('any')).toBe(0);
  });
});

describe('msatToSatIfPresent (#468)', () => {
  it('should convert an amount the node reported, including a real zero', () => {
    expect(msatToSatIfPresent(27552)).toBe(27.552);
    expect(msatToSatIfPresent('27552')).toBe(27.552);
    expect(msatToSatIfPresent(0)).toBe(0);
    expect(msatToSatIfPresent('0')).toBe(0);
  });

  it('should leave an amount the node did not report undefined', () => {
    expect(msatToSatIfPresent(undefined)).toBeUndefined();
    expect(msatToSatIfPresent(null)).toBeUndefined();
    expect(msatToSatIfPresent('')).toBeUndefined();
  });
});

describe('getLNDTxidBytes', () => {
  // txid_str and txid_bytes of the same outpoint, as LND's REST API returned them from the regtest fixture.
  const txidStr = '56941c4f0f3dab1441f4f83246cd8f05580e040b4a34d383fd1925176d50ec1b';
  const txidBytes = 'G+xQbRclGf2D0zRKCwQOWAWPzUYy+PRBFKs9D08clFY=';

  it('should turn a display-order txid into the base64 bytes LND expects', () => {
    expect(getLNDTxidBytes(txidStr)).toBe(txidBytes);
    expect(getLNDTxidBytes(' ' + txidStr + ' ')).toBe(txidBytes);
  });

  it('should return an empty string without a txid', () => {
    expect(getLNDTxidBytes(undefined)).toBe('');
    expect(getLNDTxidBytes('')).toBe('');
  });
});

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

  it('should round a default fee limit for a fractional amount up to whole sats', () => {
    expect(getFeeLimitSat('default', null, 50.123)).toBe(51);
    expect(getFeeLimitSat('default', null, 0.5)).toBe(1);
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

describe('getCLNFeeRatePerKb', () => {
  it('should send a rate in Sats/vByte as whole sats per 1000 vBytes', () => {
    expect(getCLNFeeRatePerKb(10)).toBe('10000perkb');
    expect(getCLNFeeRatePerKb('12')).toBe('12000perkb');
    expect(getCLNFeeRatePerKb(1.5)).toBe('1500perkb');
  });

  // Core Lightning accepts only a whole number; these give a fraction when multiplied by 1000 in floating point.
  it('should round a decimal rate to a whole number', () => {
    expect(getCLNFeeRatePerKb(16.1)).toBe('16100perkb');
    expect(getCLNFeeRatePerKb(32.3)).toBe('32300perkb');
    expect(getCLNFeeRatePerKb(2.01)).toBe('2010perkb');
  });
});
