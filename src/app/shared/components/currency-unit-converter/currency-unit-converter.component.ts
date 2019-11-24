import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';

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
  private unSubs = [new Subject()];
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

  constructor(public commonService: CommonService) {}

  ngOnInit() {}

  getCurrencyValues(values) {
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
