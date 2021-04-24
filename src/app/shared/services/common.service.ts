import { Injectable, OnInit } from '@angular/core';
import { of, Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { DataService } from './data.service';
import { CurrencyUnitEnum, TimeUnitEnum, ScreenSizeEnum } from './consts-enums-functions';

@Injectable()
export class CommonService implements OnInit {
  currencyUnits = [];
  CurrencyUnitEnum = CurrencyUnitEnum;
  conversionData = { data: null, last_fetched: null };
  private screenSize = ScreenSizeEnum.MD;
  private containerSize = {width: 1200, height: 800};

  constructor(private dataService: DataService) {}

  ngOnInit() {}

  getScreenSize() {
    return this.screenSize;
  }

  setScreenSize(screenSize: ScreenSizeEnum) {
    this.screenSize = screenSize;
  }

  getContainerSize() {
    return this.containerSize;
  }

  setContainerSize(width: number, height) {
    this.containerSize = {width: width, height: height};
  }

  sortByKey(array: any[], key: string, keyDataType: string, direction = 'asc') {
    if (keyDataType === 'number') {
      if (direction === 'desc') {
        return array.sort((a, b) => +a[key] > +b[key] ? -1 : 1);
      } else {
        return array.sort((a, b) => +a[key] > +b[key] ? 1 : -1);
      }
    } else {
      if (direction === 'desc') {
        return array.sort((a, b) => a[key] > b[key] ? -1 : 1);
      } else {
        return array.sort((a, b) => a[key] > b[key] ? 1 : -1);
      }
    }
  }

  sortDescByKey(array, key) {
    return array.sort(function (a, b) {
      const x = +a[key];
      const y = +b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

  sortAscByKey(array, key) {
    return array.sort(function (a, b) {
      const x = +a[key];
      const y = +b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
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

  convertCurrency(value: number, from: string, otherCurrencyUnit: string, fiatConversion: boolean): Observable<any> {
    let latest_date = new Date().valueOf();
    if(fiatConversion && otherCurrencyUnit) {
      if(this.conversionData.data && this.conversionData.last_fetched && (latest_date < (this.conversionData.last_fetched.valueOf() + 300000))) {
        return of(this.convertWithFiat(value, from, otherCurrencyUnit));
      } else {
        return this.dataService.getFiatRates()
        .pipe(take(1),
        map((data: any) => {
          this.conversionData.data = data ? JSON.parse(data) : {};
          this.conversionData.last_fetched = latest_date;
          return this.convertWithFiat(value, from, otherCurrencyUnit);
        }));
      }
    } else {
      return of(this.convertWithoutFiat(value, from));
    }
  }

  convertWithoutFiat(value: number, from: string) {
    let returnValue = {};
    returnValue[CurrencyUnitEnum.SATS] = 0;
    returnValue[CurrencyUnitEnum.BTC] = 0;
    switch (from) {
      case CurrencyUnitEnum.SATS:
        returnValue[CurrencyUnitEnum.SATS] = value;
        returnValue[CurrencyUnitEnum.BTC] = value * 0.00000001;
        break;
      case CurrencyUnitEnum.BTC:
        returnValue[CurrencyUnitEnum.SATS] = value * 100000000;
        returnValue[CurrencyUnitEnum.BTC] = value;
        break;
      default:
        break;
    }
    return returnValue;
  }

  convertWithFiat(value: number, from: string, otherCurrencyUnit: string) {
    let returnValue = {unit: otherCurrencyUnit, symbol: this.conversionData.data[otherCurrencyUnit].symbol};
    returnValue[CurrencyUnitEnum.SATS] = 0;
    returnValue[CurrencyUnitEnum.BTC] = 0;
    returnValue[CurrencyUnitEnum.OTHER] = 0;
    switch (from) {
      case CurrencyUnitEnum.SATS:
        returnValue[CurrencyUnitEnum.SATS] = value;
        returnValue[CurrencyUnitEnum.BTC] = value * 0.00000001;
        returnValue[CurrencyUnitEnum.OTHER] = value * 0.00000001 * this.conversionData.data[otherCurrencyUnit].last;
        break;
      case CurrencyUnitEnum.BTC:
        returnValue[CurrencyUnitEnum.SATS] = value * 100000000;
        returnValue[CurrencyUnitEnum.BTC] = value;
        returnValue[CurrencyUnitEnum.OTHER] = value * this.conversionData.data[otherCurrencyUnit].last;
        break;
      case (CurrencyUnitEnum.OTHER):
        returnValue[CurrencyUnitEnum.SATS] = value / this.conversionData.data[otherCurrencyUnit].last * 100000000;
        returnValue[CurrencyUnitEnum.BTC] = value / this.conversionData.data[otherCurrencyUnit].last;
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

  convertTimestampToDate(num: number) {
    return new Date(num * 1000).toUTCString().substring(5, 22).replace(' ', '/').replace(' ', '/').toUpperCase();
  };

  downloadFile(data: any[], filename: string, fromFormat = '.json', toFormat = '.csv') {
    let blob = new Blob();
    if (fromFormat === '.json') {
      blob = new Blob(['\ufeff' + this.convertToCSV(data)], { type: 'text/csv;charset=utf-8;' });
    } else {
      blob = new Blob([data.toString()], { type: 'text/plain;charset=utf-8' });
    }
    let downloadUrl = document.createElement('a');
    let url = URL.createObjectURL(blob);
    let isSafariBrowser = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1;
    if (isSafariBrowser) {
      downloadUrl.setAttribute('target', '_blank');
    }
    downloadUrl.setAttribute('href', url);
    downloadUrl.setAttribute('download', filename + toFormat);
    downloadUrl.style.visibility = 'hidden';
    document.body.appendChild(downloadUrl);
    downloadUrl.click();
    document.body.removeChild(downloadUrl);
  }

  convertToCSV(objArray: any[]) {
    let keys = [];
    let dataRow = '';
    let arrayField = '';
    let csvStrArray = '';
    if (typeof objArray !== 'object') { objArray = JSON.parse(objArray); }
    objArray.forEach((obj, i) => {
      for(var key in obj) {
        if (keys.findIndex(keyEle => keyEle === key) < 0) {
          keys.push(key); 
        }
      }
    });
    let header = keys.join(',');
    csvStrArray = header + '\r\n';
    objArray.forEach(obj => {
      dataRow = '';
      keys.forEach(key => {
        if (obj.hasOwnProperty(key)) { 
          if (Array.isArray(obj[key])) {
            arrayField = '';
            obj[key].forEach((arrEl, i) => {
              if(typeof arrEl === 'object') {
                arrayField += '(' + JSON.stringify(arrEl).replace(/\,/g, ';') + ')';
              } else {
                arrayField += '(' + arrEl + ')';
              }
            });
            dataRow += arrayField + ',';
          } else {
            if(typeof obj[key] === 'object') {
              dataRow += JSON.stringify(obj[key]).replace(/\,/g, ';') + ','; 
            } else {
              dataRow += obj[key] + ','; 
            }
          }
        } else {
          dataRow += ','; 
        }
      });
      csvStrArray += dataRow.slice(0, -1) + '\r\n';
    });
    return csvStrArray;
  }

  isVersionCompatible(currentVersion, checkVersion) {
    let versionsArr = currentVersion.trim().replace('v', '').split('-')[0].split('.');
    let checkVersionsArr = checkVersion.split('.');
    return (+versionsArr[0] > +checkVersionsArr[0])
    || (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] > +checkVersionsArr[1])
    || (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] === +checkVersionsArr[1] && +versionsArr[2] >= +checkVersionsArr[2]);
  }

}
