import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ECPair, crypto } from 'bitcoinjs-lib';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { LoggerService } from '../../shared/services/logger.service';
import { AlertTypeEnum } from '../../shared/services/consts-enums-functions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';

@Injectable()
export class BoltzService {
  private BOLTZ_LND_NODE = '026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@104.196.200.39:9735';
  private BOLTZ_API = 'https://testnet.boltz.exchange/api/';

  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  getPairs() {
    const pairsUrl = this.BOLTZ_API + 'getPairs';
    return this.httpClient.get(pairsUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Boltz Terms', err)));
  }

  getLNDNode() {
    return this.BOLTZ_LND_NODE;
  }

  onSwap(direction, invoiceAmount) {
    let requestBody = {};
    if(direction === SwapTypeEnum.WITHDRAWAL) {
      const preimage = this.randomBytes(32);
      const preimageHash = crypto.sha256(preimage);
      requestBody = { 
        type: 'reversesubmarine',
        pairId: 'LTC/BTC',
        orderSide: 'buy',
        invoiceAmount,
        preimageHash: preimageHash.toString('hex'),
        claimPublicKey: this.getKeys().publicKey
      };
    } else {
      requestBody = { 
        type: 'submarine',
        pairId: 'LTC/BTC',
        orderSide: 'sell',
        // invoice, TODO get from LND
        refundPublicKey: this.getKeys().publicKey
      };
    }
    
    const swapUrl = this.BOLTZ_API + 'createswap';
    return this.httpClient.post(swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Withdrawal', err)));
  }

  getKeys() {
    const keys = ECPair.makeRandom({ });
    return {
      publicKey: keys.publicKey.toString('hex'),
      privateKey: keys.privateKey.toString('hex'),
    };
  }

  randomBytes(size) {
    const bytes = Buffer.allocUnsafe(size);
    window.crypto.getRandomValues(bytes);
  
    return bytes;
  };


  handleErrorWithoutAlert(actionName: string, err: { status: number, error: any }) {
    this.logger.error('ERROR IN: ' + actionName + '\n' + JSON.stringify(err));
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.error.errno === 'ECONNREFUSED' || err.error.error.errno === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Swap Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Swap Server', URL: actionName },
          component: ErrorMessageComponent
        }
      }));
    }
    return throwError(err);
  }

  handleErrorWithAlert(errURL: string, err: any) {
    if (typeof err.error.error === 'string') {
      try {
        err = JSON.parse(err.error.error);
      } catch(err) {}
    } else {
      err = err.error.error.error ? err.error.error.error : err.error.error ? err.error.error : err.error ? err.error : { code : 500, message: 'Unknown Error' };
    }
    this.logger.error(err);
    this.store.dispatch(new RTLActions.CloseSpinner())
    if (err.status === 401) {
      this.logger.info('Redirecting to Login');
      this.store.dispatch(new RTLActions.Logout());
    } else if (err.errno === 'ECONNREFUSED') {
      this.store.dispatch(new RTLActions.OpenAlert({
        data: {
          type: 'ERROR',
          alertTitle: 'Swap Not Connected',
          message: { code: 'ECONNREFUSED', message: 'Unable to Connect to Swap Server', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    } else {
      this.store.dispatch(new RTLActions.OpenAlert({data: {
          type: AlertTypeEnum.ERROR,
          alertTitle: 'ERROR',
          message: { code: err.code ? err.code : err.status, message: err.message ? err.message : 'Unknown Error', URL: errURL },
          component: ErrorMessageComponent
        }
      }));
    }
    return throwError(err);
  }
}
