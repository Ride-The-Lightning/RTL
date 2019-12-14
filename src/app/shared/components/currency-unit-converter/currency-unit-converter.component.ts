import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-currency-unit-converter',
  templateUrl: './currency-unit-converter.component.html',
  styleUrls: ['./currency-unit-converter.component.scss']
})
export class CurrencyUnitConverterComponent implements OnInit, OnDestroy {
  public currencyUnitEnum = CurrencyUnitEnum;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  private _values: Array<any>;
  private _currencyUnits = [];
  private unSubs = [new Subject(), new Subject()];
  get values(): Array<any> { return this._values; }  
  get currencyUnits(): Array<any> { return this._currencyUnits; }  
  @Input() set values(data: Array<any>) { 
    this._values = data;
    if(this._currencyUnits.length > 2 && this._values[0].dataValue >= 0) {
      this.getCurrencyValues(this._values);
    }
  }
  @Input() set currencyUnits(data: Array<any>) {
    this._currencyUnits = data;
    if(this._currencyUnits.length > 2 && this._values[0].dataValue >= 0) {
      this.getCurrencyValues(this._values);
    }
  }

  constructor(public commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.currencyUnits = rtlStore.selNode.settings.currencyUnits;
      if(this.currencyUnits.length > 2 && this.values[0].dataValue >= 0) {
        this.getCurrencyValues(this._values);
      }      
    });
  }

  getCurrencyValues(values) {
    console.warn('GETTING VALUES: ' + this.currencyUnits[2]);
    values.forEach(value => {
      if(value.dataValue > 0) {
        this.commonService.convertCurrency(value.dataValue, CurrencyUnitEnum.SATS, this.currencyUnits[2])
        .pipe(takeUntil(this.unSubs[0]))
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
