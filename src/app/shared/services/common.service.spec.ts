import { DatePipe } from '@angular/common';
import { CommonService } from './common.service';
import { LoggerService } from './logger.service';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService(null as any, new LoggerService(), new DatePipe('en-US'), null as any);
  });

  describe('convertToCSV', () => {
    it('should write plain values unchanged', () => {
      const csv = commonService.convertToCSV([{ alias: 'honest-node', amount: 1000, active: true }, { alias: 'other', amount: -5, active: false }]);
      expect(csv).toBe('alias,amount,active\r\nhonest-node,1000,true\r\nother,-5,false\r\n');
    });

    it('should neutralise text that a spreadsheet would read as a formula', () => {
      const csv = commonService.convertToCSV([
        { alias: '=cmd|\'/C calc\'!A0' },
        { alias: '+1+1' },
        { alias: '-2+3' },
        { alias: '@SUM(1)' },
        { alias: '\tx' },
        { alias: '\rx' }
      ]);
      expect(csv.split('\r\n')).toEqual([
        'alias',
        '\'=cmd|\'/C calc\'!A0',
        '\'+1+1',
        '\'-2+3',
        '\'@SUM(1)',
        '\'\tx',
        '"\'\rx"',
        ''
      ]);
    });

    it('should keep numeric text with a sign as a number', () => {
      const csv = commonService.convertToCSV([{ amount: '-50000', fee: '+12.5' }]);
      expect(csv).toBe('amount,fee\r\n-50000,+12.5\r\n');
    });

    it('should quote text containing commas, quotes or line breaks so rows and columns stay aligned', () => {
      const csv = commonService.convertToCSV([{ memo: 'a,b', note: 'say "hi"', other: 'line1\r\nline2', last: 'x' }]);
      expect(csv).toBe('memo,note,other,last\r\n"a,b","say ""hi""","line1\r\nline2",x\r\n');
    });

    it('should keep an array field with a comma in one column', () => {
      const csv = commonService.convertToCSV([{ hops: ['a,b', 'c'], last: 'x' }]);
      expect(csv).toBe('hops,last\r\n"(a,b)(c)",x\r\n');
    });

    it('should quote an object field so its JSON stays in one column', () => {
      const csv = commonService.convertToCSV([{ policy: { fee: 1, note: '=x' }, last: 'x' }]);
      expect(csv).toBe('policy,last\r\n"{""fee"":1;""note"":""=x""}",x\r\n');
    });

    it('should leave an empty cell for a missing key', () => {
      const csv = commonService.convertToCSV([{ a: 1, b: 2 }, { a: 3 }]);
      expect(csv).toBe('a,b\r\n1,2\r\n3,\r\n');
    });
  });
});
