import { getCLNSweepBlocks, getCLNCloseTxid } from './consts-enums-functions';

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

  it('should return null before any close transaction exists', () => {
    expect(getCLNCloseTxid({ state: 'CHANNELD_NORMAL', scratch_txid: txid })).toBeNull();
    expect(getCLNCloseTxid({ state: 'CHANNELD_SHUTTING_DOWN', scratch_txid: txid })).toBeNull();
    expect(getCLNCloseTxid({ state: 'ONCHAIN' })).toBeNull();
  });
});
