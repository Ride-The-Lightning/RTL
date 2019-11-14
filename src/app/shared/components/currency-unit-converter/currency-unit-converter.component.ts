import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../services/logger.service';
import { CurrencyUnit } from '../../models/enums';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-currency-unit-converter',
  templateUrl: './currency-unit-converter.component.html',
  styleUrls: ['./currency-unit-converter.component.scss']
})
export class CurrencyUnitConverterComponent implements OnInit, OnDestroy {
  @Input() values = [];
  currencyUnits = [];
  CurrencyUnitEnum = CurrencyUnit;
  unitConversionValue = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private httpClient: HttpClient) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(take(2))
    .subscribe((rtlStore) => {
      this.currencyUnits = rtlStore.nodeSettings.currencyUnits;
      this.logger.info(rtlStore);
      if(this.currencyUnits[2]) {
        this.httpClient.get('https://blockchain.info/ticker')
        .pipe(takeUntil(this.unSubs[0]))
        .subscribe((data: any) => {
          this.unitConversionValue = data[this.currencyUnits[2]].last;
        });
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
