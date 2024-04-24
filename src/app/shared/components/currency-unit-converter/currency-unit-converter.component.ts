import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS } from '../../services/consts-enums-functions';
import { CommonService } from '../../services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-currency-unit-converter',
  templateUrl: './currency-unit-converter.component.html',
  styleUrls: ['./currency-unit-converter.component.scss']
})
export class CurrencyUnitConverterComponent implements OnInit, OnChanges, OnDestroy {

  @Input() values: any[] = [];
  public currencyUnitEnum = CurrencyUnitEnum;
  public currencyUnitFormats = CURRENCY_UNIT_FORMATS;
  public currencyUnits: string[] = [];
  public fiatConversion = false;
  public conversionErrorMsg = '';
  private unSubs = [new Subject(), new Subject(), new Subject()];

  constructor(public commonService: CommonService, private store: Store<RTLState>) { }

  ngOnChanges() {
    if (this.currencyUnits.length > 1 && this.values[0] && this.values[0].dataValue >= 0) {
      this.getCurrencyValues();
    }
  }

  ngOnInit() {
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((selNode) => {
      this.fiatConversion = selNode.settings.fiatConversion;
      this.currencyUnits = selNode.settings.currencyUnits;
      if (!this.fiatConversion) {
        this.currencyUnits.splice(2, 1);
      }
      if (this.currencyUnits.length > 1 && this.values[0] && this.values[0].dataValue >= 0) {
        this.getCurrencyValues();
      }
    });
  }

  getCurrencyValues() {
    this.values.forEach((value, i) => {
      if (value.dataValue > 0) {
        this.commonService.convertCurrency(value.dataValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.BTC, '', true, value.title).
          pipe(takeUntil(this.unSubs[1])).
          subscribe((data) => {
            this.values[i][CurrencyUnitEnum.BTC] = data.BTC;
          });
        this.commonService.convertCurrency(value.dataValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.currencyUnits[2], this.fiatConversion, value.title).
          pipe(takeUntil(this.unSubs[2])).
          subscribe({
            next: (data) => {
              console.log(data);
              this.values[i][CurrencyUnitEnum.OTHER] = data.OTHER;
            }, error: (err) => {
              this.conversionErrorMsg = 'Conversion Error: ' + err;
            }
          });
      } else {
        this.values[i][CurrencyUnitEnum.BTC] = value.dataValue;
        if (this.conversionErrorMsg === '') {
          this.values[i][CurrencyUnitEnum.OTHER] = value.dataValue;
        }
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
