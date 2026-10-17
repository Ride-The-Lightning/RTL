import { SatsAmountPartsPipe } from './app.pipe';

describe('SatsAmountPartsPipe', () => {
  const pipe = new SatsAmountPartsPipe();

  it('should mark each amount in Sats so it can be shown in bold', () => {
    expect(pipe.transform('The cheapest route costs 500,000 Sats in fees, more than the max fee of 500 Sats.')).toEqual([
      { text: 'The cheapest route costs ', isAmount: false },
      { text: '500,000 Sats', isAmount: true },
      { text: ' in fees, more than the max fee of ', isAmount: false },
      { text: '500 Sats', isAmount: true },
      { text: '.', isAmount: false }
    ]);
  });

  it('should keep text without an amount, and markup, as plain text', () => {
    expect(pipe.transform('Insufficient Balance <b>x</b>')).toEqual([{ text: 'Insufficient Balance <b>x</b>', isAmount: false }]);
    expect(pipe.transform('')).toEqual([]);
  });
});
