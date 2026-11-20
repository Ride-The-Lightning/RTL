import { TitleCasePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { DataService } from './data.service';
import { LoggerService } from './logger.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { mockResponseData } from '../test-helpers/test-data';
import { RTLState } from '../../store/rtl.state';

describe('DataService', () => {
  let httpClientSpy: { get: jasmine.Spy };
  let dataService: DataService;
  let store: Store<RTLState>;
  let logger: LoggerService;
  let snackbar: MatSnackBar;
  let titleCasePipe: TitleCasePipe;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post']);
    dataService = new DataService(httpClientSpy as any, store, logger, snackbar, titleCasePipe);
  });

  it('should return expected rates (HttpClient called once)', (done: DoneFn) => {
    httpClientSpy.get.and.returnValue(of(mockResponseData.fiatRates));
    dataService.getFiatRates().
      subscribe({
        next: (rates) => {
          expect(rates).toEqual(mockResponseData.fiatRates);
          done();
        },
        error: done.fail
      });
    expect(httpClientSpy.get.calls.count()).toBe(1);
  });

  it('should return an error when the server returns a 401', (done: DoneFn) => {
    httpClientSpy.get.and.returnValue(throwError(() => mockResponseData.error401));
    dataService.getFiatRates().subscribe({
      next: (rates) => done.fail('expected an error, not rates'),
      error: (error) => {
        expect(error.status).toEqual('401');
        expect(error.statusText).toContain('Not Found');
        done();
      }
    });
  });

  // A value that goes into the path of a request URL is one segment of it, whatever it contains.
  describe('values in a request path', () => {
    const value = 'ab/../cd?e=f#g';
    // The path the browser requests for a URL, relative ones resolved as it resolves them.
    const requestedPath = () => new URL(httpClientSpy.get.calls.mostRecent().args[0], 'http://localhost:3000/rtl/').pathname;

    beforeEach(() => {
      store = jasmine.createSpyObj('Store', ['dispatch']);
      dataService = new DataService(httpClientSpy as any, store, logger, snackbar, titleCasePipe);
      httpClientSpy.get.and.returnValue(of({}));
    });

    ['lnd', 'ecl'].forEach((implementation) => {
      it('should request the ' + implementation + ' decode route with the payment string as its last segment', (done: DoneFn) => {
        dataService.setLnImplementation(implementation);
        dataService.decodePayment(value, true).subscribe({
          next: () => {
            expect(requestedPath()).toBe('/rtl/api/' + implementation + '/payments/decode/' + encodeURIComponent(value));
            done();
          },
          error: done.fail
        });
      });

      it('should request the ' + implementation + ' node route with the pubkey as its last segment', (done: DoneFn) => {
        dataService.setLnImplementation(implementation);
        dataService.getAliasesFromPubkeys(value, false).subscribe({
          next: () => {
            expect(requestedPath()).toBe('/rtl/api/' + implementation + '/network/node/' + encodeURIComponent(value));
            done();
          },
          error: done.fail
        });
      });
    });

    it('should request the explorer transaction route with the transaction id as its last segment', () => {
      dataService.getBlockExplorerTransaction(value).subscribe();
      expect(requestedPath()).toBe('/rtl/api/conf/explorerTransaction/' + encodeURIComponent(value));
    });

    it('should leave an ordinary payment string as it is', (done: DoneFn) => {
      dataService.setLnImplementation('lnd');
      dataService.decodePayment('lnbcrt100u1test', true).subscribe({
        next: () => {
          expect(requestedPath()).toBe('/rtl/api/lnd/payments/decode/lnbcrt100u1test');
          done();
        },
        error: done.fail
      });
    });
  });
});
