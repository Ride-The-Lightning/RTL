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
});
