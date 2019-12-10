import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, of, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { CurrencyUnitEnum, TimeUnitEnum } from './consts-enums-functions';

@Injectable()
export class CommonService implements OnInit, OnDestroy {
  currencyUnits = [];
  CurrencyUnitEnum = CurrencyUnitEnum;
  unitConversionValue = 0;
  containerWidthChanged = new Subject<string>();
  conversionData = { data: null, last_fetched: null };
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private httpClient: HttpClient) {}

  ngOnInit() {}

  sortDescByKey(array, key) {
    return array.sort(function (a, b) {
      const x = +a[key];
      const y = +b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

  camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => { 
        return index == 0 ? word.toLowerCase() : word.toUpperCase(); 
    }).replace(/\s+/g, '');
  } 

  titleCase(str) {
    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
  } 

  changeContainerWidth(fieldType: string) {
    this.containerWidthChanged.next(fieldType);
  }

  convertCurrency(value: number, from: string, otherCurrencyUnit: string): Observable<any> {
    let latest_date = new Date().valueOf();
    if(this.conversionData.data && this.conversionData.last_fetched && (latest_date < (this.conversionData.last_fetched.valueOf() + 300000))) {
      return of(this.convert(value, from, otherCurrencyUnit));
    } else {
      return this.httpClient.get('https://blockchain.info/ticker')
      .pipe(take(1),
      map(data => {
        this.conversionData.data = data;
        this.conversionData.last_fetched = latest_date;
        this.unitConversionValue = this.conversionData.data[otherCurrencyUnit].last;
        return this.convert(value, from, otherCurrencyUnit);
      }));
    }
  }

  convert(value: number, from: string, otherCurrencyUnit: string) {
    let returnValue = {unit: otherCurrencyUnit, symbol: this.conversionData.data[otherCurrencyUnit].symbol};
    returnValue[CurrencyUnitEnum.SATS] = 0;
    returnValue[CurrencyUnitEnum.BTC] = 0;
    returnValue[CurrencyUnitEnum.OTHER] = 0;
    switch (from) {
      case CurrencyUnitEnum.SATS:
        returnValue[CurrencyUnitEnum.SATS] = value;
        returnValue[CurrencyUnitEnum.BTC] = value * 0.00000001;
        returnValue[CurrencyUnitEnum.OTHER] = value * 0.00000001 * this.unitConversionValue;
        break;
      case CurrencyUnitEnum.BTC:
        returnValue[CurrencyUnitEnum.SATS] = value * 100000000;
        returnValue[CurrencyUnitEnum.BTC] = value;
        returnValue[CurrencyUnitEnum.OTHER] = value * this.unitConversionValue;
        break;
      case (CurrencyUnitEnum.OTHER):
        returnValue[CurrencyUnitEnum.SATS] = value / this.unitConversionValue * 100000000;
        returnValue[CurrencyUnitEnum.BTC] = value / this.unitConversionValue;
        returnValue[CurrencyUnitEnum.OTHER] = value;
        break;
      default:
        break;
    }
    return returnValue;
  }

  convertTime(value: number, from: string, to: string) {
    switch (from) {
      case TimeUnitEnum.SECS:
        switch (to) {
          case TimeUnitEnum.MINS:
            value = value / 60;
            break;
          case TimeUnitEnum.HOURS:
            value = value / 3600;
            break;
          case TimeUnitEnum.DAYS:
            value = value / (3600 * 24);
            break;
          default:
            break;
        }
        break;
      case TimeUnitEnum.MINS:
        switch (to) {
          case TimeUnitEnum.SECS:
            value = value * 60;
            break;
          case TimeUnitEnum.HOURS:
            value = value / 60;
            break;
          case TimeUnitEnum.DAYS:
            value = value / (60 * 24);
            break;
          default:
            break;
        }
        break;
      case TimeUnitEnum.HOURS:
        switch (to) {
          case TimeUnitEnum.SECS:
            value = value * 3600;
            break;
          case TimeUnitEnum.MINS:
            value = value * 60;
            break;
          case TimeUnitEnum.DAYS:
            value = value / 24;
            break;
          default:
            break;
        }
        break;
      case TimeUnitEnum.DAYS:
        switch (to) {
          case TimeUnitEnum.SECS:
            value = value * 3600 * 24;
            break;
          case TimeUnitEnum.MINS:
            value = value * 60 * 24;
            break;
          case TimeUnitEnum.HOURS:
            value = value * 24;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
    return value;
  }

  ngOnDestroy() {
    this.containerWidthChanged.next();
    this.containerWidthChanged.complete();
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
