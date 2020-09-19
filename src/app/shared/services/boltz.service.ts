import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ECPair, crypto } from 'bitcoinjs-lib';

import { boltzEnvironment, environment, API_URL } from '../../../environments/environment';
import { CurrentyTypeSwapEnum } from '../../shared/services/consts-enums-functions';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { LoggerService } from '../../shared/services/logger.service';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';
import { Actions } from '@ngrx/effects';

@Injectable()
export class BoltzService {
  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  getBoltzServerUrl() {
    const CHILD_API_URL = API_URL + '/lnd';
    return this.httpClient.get(CHILD_API_URL + environment.BOLTZ_SWAPS_API + '/boltz/serverUrl');
  }

  getPairs(boltzServerUrl) {
    const pairsUrl = boltzServerUrl + boltzEnvironment.GET_PAIRS;
    return this.httpClient.get(pairsUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Boltz Terms', err)));
  }

  getNodes(boltzServerUrl) {
    const nodesUrl = boltzServerUrl + boltzEnvironment.GET_NODES;
    return this.httpClient.get(nodesUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Boltz Nodes', err)));
  }

  getSwapInfo() {
    const keys = ECPair.makeRandom({ });
    return {
      preimage: this.randomBytes(32),
      publicKey: keys.publicKey.toString('hex'),
      privateKey: keys.privateKey.toString('hex'),
    }
  }

  onSwap({boltzServerUrl, direction, invoiceAmount, swapInfo, paymentRequest}) {
    const {preimage, publicKey} = swapInfo;
    let requestBody = {};
    const swapUrl = boltzServerUrl + boltzEnvironment.CREATE_SWAP;
    if(direction === SwapTypeEnum.WITHDRAWAL) {
      requestBody = { 
        type: 'reversesubmarine',
        pairId: CurrentyTypeSwapEnum.BTC_BTC,
        orderSide: 'buy',
        invoiceAmount,
        preimageHash: crypto.sha256(preimage).toString('hex'),
        claimPublicKey: publicKey
      };
      return this.httpClient.post(swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Withdrawal', err)));
    } else {
      const requestBody = {
        type: 'submarine',
        pairId: CurrentyTypeSwapEnum.BTC_BTC,
        orderSide: 'sell',
        invoice: paymentRequest,
        refundPublicKey: swapInfo.publicKey
      };
      return this.httpClient.post(swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Deposit', err)));
    }
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
}
