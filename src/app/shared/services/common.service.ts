import { Injectable, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject, of, Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

import { LoggerService } from './logger.service';
import { DataService } from './data.service';
import { CurrencyUnitEnum, TimeUnitEnum, ScreenSizeEnum, APICallStatusEnum, HOUR_SECONDS } from './consts-enums-functions';

@Injectable()
export class CommonService implements OnDestroy {

  currencyUnits = [];
  CurrencyUnitEnum = CurrencyUnitEnum;
  conversionData: any = { data: null, last_fetched: null };
  private ratesAPIStatus = APICallStatusEnum.UN_INITIATED;
  private screenSize = ScreenSizeEnum.MD;
  private containerSize = { width: 0, height: 0 };
  public containerSizeUpdated: BehaviorSubject<any> = new BehaviorSubject(this.containerSize);
  private unSubs = [new Subject(), new Subject(), new Subject()];

  constructor(public dataService: DataService, private logger: LoggerService, private datePipe: DatePipe) { }

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
    this.containerSize = { width: width, height: height };
    this.logger.info('Container Size: ' + JSON.stringify(this.containerSize));
    this.containerSizeUpdated.next(this.containerSize);
  }

  sortByKey(array: any[], key: string, keyDataType: string, direction = 'asc') {
    if (keyDataType === 'number') {
      if (direction === 'desc') {
        return array.sort((a, b) => (+a[key] > +b[key] ? -1 : 1));
      } else {
        return array.sort((a, b) => (+a[key] > +b[key] ? 1 : -1));
      }
    } else {
      if (direction === 'desc') {
        return array.sort((a, b) => (a[key] > b[key] ? -1 : 1));
      } else {
        return array.sort((a, b) => (a[key] > b[key] ? 1 : -1));
      }
    }
  }

  sortDescByKey(array, key) {
    return array.sort((a, b) => {
      const x = +a[key];
      const y = +b[key];
      return ((x > y) ? -1 : ((x < y) ? 1 : 0));
    });
  }

  sortAscByKey(array, key) {
    return array.sort((a, b) => {
      const x = +a[key];
      const y = +b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  }

  camelCase(str) {
    return str?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');
  }

  titleCase(str: string, searchValue?: string, replaceValue?: string) {
    if (searchValue && replaceValue && searchValue !== '' && replaceValue !== '') {
      str = str?.replace(new RegExp(searchValue, 'g'), replaceValue);
    }
    if (str.indexOf('!\n') > 0 || str.indexOf('.\n') > 0) {
      return str.split('\n')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + '\n', '');
    } else {
      if (str.indexOf(' ') > 0) {
        return str.split(' ')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + ' ', '');
      } else {
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
      }
    }
  }

  convertCurrency(value: number, from: string, to: string, otherCurrencyUnit: string, fiatConversion: boolean, title?: string): Observable<any> {
    const latest_date = new Date().valueOf();
    console.warn(value, from, to, otherCurrencyUnit, fiatConversion, title, this.conversionData.data);
    if (fiatConversion && otherCurrencyUnit && (from === CurrencyUnitEnum.OTHER || to === CurrencyUnitEnum.OTHER)) {
      console.warn('1');
      if (this.ratesAPIStatus !== APICallStatusEnum.INITIATED) {
        console.warn('2');
        if (this.conversionData.data && this.conversionData.last_fetched && (latest_date < (this.conversionData.last_fetched + 300000))) {
          console.warn('3');
          return of(this.convertWithFiat(value, from, otherCurrencyUnit));
        } else {
          console.warn('4');
          this.ratesAPIStatus = APICallStatusEnum.INITIATED;
          return this.dataService.getFiatRates().pipe(takeUntil(this.unSubs[0]),
            switchMap((data) => {
              console.warn('5');
              this.ratesAPIStatus = APICallStatusEnum.COMPLETED;
              this.conversionData.data = (data && typeof data === 'object') ? data : (data && typeof data === 'string') ? JSON.parse(data) : {};
              this.conversionData.last_fetched = latest_date;
              return of(this.convertWithFiat(value, from, otherCurrencyUnit));
            }),
            catchError((err) => {
              this.ratesAPIStatus = APICallStatusEnum.ERROR;
              return throwError(() => this.extractErrorMessage(err, 'Currency Conversion Error.'));
            })
          );
        }
      } else if (this.conversionData.data && this.conversionData.last_fetched && (latest_date < (this.conversionData.last_fetched + 300000))) {
        console.warn('6');
        return of(this.convertWithFiat(value, from, otherCurrencyUnit));
      } else {
        console.warn(this.conversionData.data);
        console.warn(this.conversionData.last_fetched);
        console.warn(latest_date < (this.conversionData.last_fetched + 300000));
        console.warn(this.conversionData.data && this.conversionData.last_fetched && (latest_date < (this.conversionData.last_fetched + 300000)));
        console.warn('7');
        return of(this.convertWithoutFiat(value, from));
      }
    } else {
      return of(this.convertWithoutFiat(value, from));
    }
  }

  convertWithoutFiat(value: number, from: string) {
    const returnValue = {};
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
    const returnValue = { unit: otherCurrencyUnit, symbol: this.conversionData.data[otherCurrencyUnit].symbol };
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
            value = value / HOUR_SECONDS;
            break;
          case TimeUnitEnum.DAYS:
            value = value / (HOUR_SECONDS * 24);
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
            value = value * HOUR_SECONDS;
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
            value = value * HOUR_SECONDS * 24;
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

  downloadFile(data: any[], filename: string, fromFormat = '.json', toFormat = '.csv') {
    let blob = new Blob();
    if (fromFormat === '.json') {
      blob = new Blob(['\ufeff' + this.convertToCSV(data)], { type: 'text/csv;charset=utf-8;' });
    } else {
      blob = new Blob([data.toString()], { type: 'text/plain;charset=utf-8' });
    }
    const downloadUrl = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const isSafariBrowser = navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1;
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
    const keys: string[] = [];
    let dataRow = '';
    let arrayField = '';
    let csvStrArray = '';
    if (typeof objArray !== 'object') {
      objArray = JSON.parse(objArray);
    }
    objArray.forEach((obj, i) => {
      for (const key in obj) {
        if (keys.findIndex((keyEle) => keyEle === key) < 0) {
          keys.push(key);
        }
      }
    });
    const header = keys.join(',');
    csvStrArray = header + '\r\n';
    objArray.forEach((obj) => {
      dataRow = '';
      keys.forEach((key) => {
        if (obj.hasOwnProperty(key)) {
          if (Array.isArray(obj[key])) {
            arrayField = '';
            obj[key].forEach((arrEl, i) => {
              if (typeof arrEl === 'object') {
                arrayField += '(' + JSON.stringify(arrEl)?.replace(/\,/g, ';') + ')';
              } else {
                arrayField += '(' + arrEl + ')';
              }
            });
            dataRow += arrayField + ',';
          } else {
            if (typeof obj[key] === 'object') {
              dataRow += JSON.stringify(obj[key])?.replace(/\,/g, ';') + ',';
            } else {
              if ((key.includes('timestamp') || key.includes('date'))) {
                try {
                  switch (obj[key].toString().length) {
                    case 10:
                      dataRow += this.datePipe.transform(new Date(obj[key] * 1000), 'dd/MMM/y HH:mm') + ',';
                      break;

                    case 13:
                      dataRow += this.datePipe.transform(new Date(obj[key]), 'dd/MMM/y HH:mm') + ',';
                      break;

                    default:
                      dataRow += obj[key] + ',';
                      break;
                  }
                } catch (error) {
                  dataRow += obj[key] + ',';
                }
              } else {
                dataRow += obj[key] + ',';
              }
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
    // Check for newer CLN version style compatibility
    if (currentVersion) {
      const match = currentVersion.match(/v?(?<version>\d+(?:\.\d+)*)/);
      if (match && match.groups && match.groups.version) {
        this.logger.info('Current Version: ' + match.groups.version);
        this.logger.info('Checking Compatiblility with Version: ' + checkVersion);
        const versionsArr = match.groups.version.split('.') || [];
        const checkVersionsArr = checkVersion.split('.');
        return (+versionsArr[0] > +checkVersionsArr[0]) ||
          (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] > +checkVersionsArr[1]) ||
          (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] === +checkVersionsArr[1] && +versionsArr[2] >= +checkVersionsArr[2]);
      } else {
        this.logger.error('Invalid Version String: ' + currentVersion);
        return false;
      }
    }
    return false;
  }

  extractErrorMessage(err: any, genericErrorMessage: string = 'Unknown Error.') {
    const msg = this.titleCase(
      (err.error && err.error.text && typeof err.error.text === 'string' && err.error.text.includes('<!DOCTYPE html><html lang="en">')) ? 'API Route Does Not Exist.' :
        (err.error && err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.error && typeof err.error.error.error.error.error === 'string') ? err.error.error.error.error.error :
          (err.error && err.error.error && err.error.error.error && err.error.error.error.error && typeof err.error.error.error.error === 'string') ? err.error.error.error.error :
            (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
              (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
                (err.error && typeof err.error === 'string') ? err.error :
                  (err.error && err.error.error && err.error.error.error && err.error.error.error.error && err.error.error.error.error.message && typeof err.error.error.error.error.message === 'string') ? err.error.error.error.error.message :
                    (err.error && err.error.error && err.error.error.error && err.error.error.error.message && typeof err.error.error.error.message === 'string') ? err.error.error.error.message :
                      (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
                        (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                          (err.message && typeof err.message === 'string') ? err.message : genericErrorMessage);
    this.logger.info('Error Message: ' + msg);
    return msg;
  }

  extractErrorCode(err: any, genericErrorCode: number = 500) {
    const code = (err.error && err.error.error && err.error.error.message && err.error.error.message.code) ? err.error.error.message.code :
      (err.error && err.error.error && err.error.error.code) ? err.error.error.code :
        (err.error && err.error.code) ? err.error.code :
          err.code ? err.code :
            err.status ? err.status : genericErrorCode;
    this.logger.info('Error Code: ' + code);
    return code;
  }

  extractErrorNumber(err: any, genericErrorNumber: number = 500) {
    const errNum = (err.error && err.error.error && err.error.error.errno) ? err.error.error.errno :
      (err.error && err.error.errno) ? err.error.errno :
        err.errno ? err.errno :
          err.status ? err.status : genericErrorNumber;
    this.logger.info('Error Number: ' + errNum);
    return errNum;
  }

  ngOnDestroy() {
    this.containerSizeUpdated.next(null);
    this.containerSizeUpdated.complete();
  }

}
