import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, takeLast, first } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-currency-unit-converter',
  templateUrl: './currency-unit-converter.component.html',
  styleUrls: ['./currency-unit-converter.component.scss']
})
export class CurrencyUnitConverterComponent implements OnInit, OnChanges, OnDestroy {
  @Input() values = [];
  public currencyUnitEnum = CurrencyUnitEnum;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  public currencyUnits = [];
  public fiatConversion = false;
  private unSubs = [new Subject(), new Subject()];
  // private _values: Array<any>;
  // get values(): Array<any> { return this._values; }  
  // @Input() set values(data: Array<any>) { 
  //   this._values = data;
  //   if(this.currencyUnits.length > 1 && this._values[0].dataValue >= 0) {
  //     this.getCurrencyValues(this._values);
  //   }
  // }

  constructor(public commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(first())
    .subscribe((rtlStore) => {
      this.fiatConversion = rtlStore.selNode.settings.fiatConversion;
      this.currencyUnits = rtlStore.selNode.settings.currencyUnits;
      if(!this.fiatConversion) {
        this.currencyUnits.splice(2, 1);
      }
      if(this.currencyUnits.length > 1 && this.values[0].dataValue >= 0) {
        this.getCurrencyValues(this.values);
      }
    });
  }

  ngOnChanges() {
    if(this.currencyUnits.length > 1 && this.values[0].dataValue >= 0) {
      this.getCurrencyValues(this.values);
    }
  }

  getCurrencyValues(values) {
    values.forEach(value => {
      if(value.dataValue > 0) {
        this.commonService.convertCurrency(value.dataValue, CurrencyUnitEnum.SATS, this.currencyUnits[2], this.fiatConversion)
        .pipe(takeUntil(this.unSubs[1]))
        .subscribe(data => {
          value[CurrencyUnitEnum.BTC] = data.BTC;
          value[CurrencyUnitEnum.OTHER] = data.OTHER;
        });
      } else {
        value[CurrencyUnitEnum.BTC] = value.dataValue;
        value[CurrencyUnitEnum.OTHER] = value.dataValue;
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
