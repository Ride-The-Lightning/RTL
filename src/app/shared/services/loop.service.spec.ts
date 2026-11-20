import { of } from 'rxjs';

import { LoopService } from './loop.service';
import { LoggerService } from './logger.service';

describe('LoopService', () => {
  let posts: Array<{ url: string, body: any }>;
  let gets: string[];
  let loopService: LoopService;

  beforeEach(() => {
    posts = [];
    gets = [];
    const httpClient = {
      post: (url: string, body: any) => { posts.push({ url, body }); return of({}); },
      get: (url: string) => { gets.push(url); return of({}); }
    };
    loopService = new LoopService(httpClient as any, new LoggerService(), { dispatch: () => undefined } as any, null as any);
  });

  describe('loopIn', () => {
    // #1817: the body also carried `lastHop: ''` and `externalHtlc: true`. The server ignores both,
    // so loopd funds the HTLC from the node's wallet, which is what the dialog implies. A body
    // claiming an externally funded HTLC would leave every Loop In unfunded if it were honoured.
    it('should post the amount and the two fee limits, and nothing else', () => {
      loopService.loopIn(250000, 600, 3875).subscribe();
      expect(posts.length).toBe(1);
      expect(posts[0].url).toMatch(/\/loop\/in$/);
      expect(posts[0].body).toEqual({ amount: 250000, swapFee: 600, minerFee: 3875 });
    });
  });

  describe('quotes', () => {
    // The amount is one segment of the request path, whatever it contains.
    it('should request the quote routes with the amount as their last segment', () => {
      loopService.getLoopOutQuote('25/../0?a=b#c' as any, 2, 0).subscribe();
      loopService.getLoopInQuote('25/../0?a=b#c' as any, '2', 0).subscribe();
      expect(gets.map((url) => new URL(url, 'http://localhost:3000/rtl/').pathname)).toEqual([
        '/rtl/api/loop/out/quote/' + encodeURIComponent('25/../0?a=b#c'),
        '/rtl/api/loop/in/quote/' + encodeURIComponent('25/../0?a=b#c')
      ]);
    });
  });

  describe('getSwap', () => {
    // The swap id is one segment of the request path, whatever it contains.
    it('should request the swap route with the swap id as its last segment', () => {
      loopService.getSwap('ab/../cd?e=f#g').subscribe();
      expect(gets.length).toBe(1);
      expect(new URL(gets[0], 'http://localhost:3000/rtl/').pathname).toBe('/rtl/api/loop/swap/' + encodeURIComponent('ab/../cd?e=f#g'));
    });
  });
});
