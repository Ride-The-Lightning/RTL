import { Injectable, Output } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { throwError, of } from 'rxjs';
import { catchError, mergeMap, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ECPair, crypto, Transaction, address } from 'bitcoinjs-lib';
import { detectSwap, constructClaimTransaction, Networks } from 'boltz-core';

import { environment, API_URL } from '../../../environments/environment';
import { ErrorMessageComponent } from '../../shared/components/data-modal/error-message/error-message.component';
import { LoggerService } from '../../shared/services/logger.service';
import { AlertTypeEnum } from '../../shared/services/consts-enums-functions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';
import { Actions } from '@ngrx/effects';

@Injectable()
export class BoltzService {
  private BOLTZ_LND_NODE = '026165850492521f4ac8abd9bd8088123446d126f648ca35e60f88177dc149ceb2@104.196.200.39:9735';
  private BOLTZ_API = 'https://testnet.boltz.exchange/api/';


  constructor(private httpClient: HttpClient, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  getPairs() {
    const pairsUrl = this.BOLTZ_API + 'getPairs';
    return this.httpClient.get(pairsUrl).pipe(catchError(err => this.handleErrorWithoutAlert('Boltz Terms', err)));
  }

  broadcastClaimTransaction(data, swapStatus, swapInfo) {
    console.log('initiate broadcast');
    const feeEstimationUrl = this.BOLTZ_API + 'getfeeestimation';
    const broadcastTransactionUrl = this.BOLTZ_API + 'broadcasttransaction';
    return this.httpClient.get(feeEstimationUrl).pipe(mergeMap(feeEstimation => {
      console.log('fee estimation', feeEstimation);
      console.log('data', data);
      console.log('swapStatus', swapStatus);
      console.log('swapInfo', swapInfo);
      const {redeemScript} = swapStatus;
      const {preimage, privateKey} = swapInfo;
      const lockupTransaction = Transaction.fromHex(data.transaction.hex);
      const network = this.getNetwork('BTC');
      console.log('network', network);
      const keys = ECPair.fromPrivateKey(this.getHexBuffer(privateKey));
      console.log('keys', keys);
      const addressParam = address.toOutputScript(swapInfo.address, network);
      console.log('addressParam', addressParam);
      console.log('redeemScript', redeemScript);
      console.log('lockupTransaction', lockupTransaction);
      const detectSwapObj = detectSwap(redeemScript, lockupTransaction);
      console.log('detectSwapObj', detectSwapObj);
      const claimTransaction = constructClaimTransaction(
        [
          {
            ...detectSwapObj,
            redeemScript,
            txHash: lockupTransaction.getHash(),
            preimage: this.getHexBuffer(preimage),
            keys
          },
        ],
        addressParam,
        feeEstimation['BTC'],
        false
      ).toHex();
      console.log('claim', claimTransaction);
      return this.httpClient.post(broadcastTransactionUrl, {
        urrency: 'BTC',
        transactionHex: claimTransaction
      }).pipe(catchError(err => this.handleErrorWithoutAlert('Boltz Terms', err)));
    }))
  }

  getLNDNode() {
    return this.BOLTZ_LND_NODE;
  }

  //move to utils/helpers
  getHexBuffer(input) {
    return Buffer.from(input, 'hex');
  };

  capitalizeFirstLetter = input => {
    return input.charAt(0).toUpperCase() + input.slice(1);
  };

  //TODO figure out network
  getNetwork(symbol) {
    console.log('getting network');
    const network = 'testnet';
    const bitcoinNetwork = Networks[`bitcoin${this.capitalizeFirstLetter(network)}`];
    const litecoinNetwork = Networks[`litecoin${this.capitalizeFirstLetter(network)}`];
    console.log('returning network');
    return symbol === 'BTC' ? bitcoinNetwork : litecoinNetwork;
  };

  getSwapInfo() {
    const keys = ECPair.makeRandom({ });
    return {
      preimage: this.randomBytes(32),
      publicKey: keys.publicKey.toString('hex'),
      privateKey: keys.privateKey.toString('hex'),
    }
  }

  onSwap({direction, invoiceAmount, swapInfo, paymentRequest}) {
    console.log('direction', direction);
    const {preimage, publicKey} = swapInfo;
    let requestBody = {};
    const swapUrl = this.BOLTZ_API + 'createswap';
    if(direction === SwapTypeEnum.WITHDRAWAL) {
      requestBody = { 
        type: 'reversesubmarine',
        pairId: 'BTC/BTC',
        orderSide: 'buy',
        invoiceAmount,
        preimageHash: crypto.sha256(preimage).toString('hex'),
        claimPublicKey: publicKey
      };
      return this.httpClient.post(swapUrl, requestBody).pipe(catchError(err => this.handleErrorWithoutAlert('Withdrawal', err)));
    } else {
      const requestBody = { 
        type: 'submarine',
        pairId: 'BTC/BTC',
        orderSide: 'sell',
        invoice: paymentRequest,
        refundPublicKey: swapInfo.publicKey
      };
      console.log('posting', requestBody);
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

export const SwapUpdateEvent = {
  InvoicePaid: 'invoice.paid',
  InvoiceSettled: 'invoice.settled',
  InvoiceFailedToPay: 'invoice.failedToPay',

  TransactionFailed: 'transaction.failed',
  TransactionMempool: 'transaction.mempool',
  TransactionClaimed: 'transaction.claimed',
  TransactionRefunded: 'transaction.refunded',
  TransactionConfirmed: 'transaction.confirmed',

  SwapExpired: 'swap.expired',
};