import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, Subject } from 'rxjs';
import { map, mergeMap, catchError, take, withLatestFrom } from 'rxjs/operators';

import { MatDialog } from '@angular/material';

import { environment } from '../../../environments/environment';
import { LoggerService } from '../services/logger.service';
import { Settings } from '../models/RTLconfig';
import { GetInfo, Fees, Balance, NetworkInfo, Payment, Invoice, GraphNode, Transaction, SwitchReq } from '../models/lndModels';

import { SpinnerDialogComponent } from '../components/spinner-dialog/spinner-dialog.component';
import { AlertMessageComponent } from '../components/alert-message/alert-message.component';
import { ConfirmationMessageComponent } from '../components/confirmation-message/confirmation-message.component';

import * as RTLActions from './rtl.actions';
import * as fromRTLReducer from './rtl.reducers';

@Injectable()
export class RTLEffects implements OnDestroy {
  dialogRef: any;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(
    private actions$: Actions,
    private httpClient: HttpClient,
    private store: Store<fromRTLReducer.State>,
    private logger: LoggerService,
    public dialog: MatDialog,
    private router: Router) { }

  @Effect({ dispatch: false })
  openSpinner = this.actions$.pipe(
    ofType(RTLActions.OPEN_SPINNER),
    map((action: RTLActions.OpenSpinner) => {
      this.dialogRef = this.dialog.open(SpinnerDialogComponent, { data: { titleMessage: action.payload}});
    }
  ));

  @Effect({ dispatch: false })
  closeSpinner = this.actions$.pipe(
    ofType(RTLActions.CLOSE_SPINNER),
    map((action: RTLActions.CloseSpinner) => {
      this.dialogRef.close();
    }
  ));

  @Effect({ dispatch: false })
  openAlert = this.actions$.pipe(
    ofType(RTLActions.OPEN_ALERT),
    map((action: RTLActions.OpenAlert) => {
      this.dialogRef = this.dialog.open(AlertMessageComponent, action.payload);
    }
  ));

  @Effect({ dispatch: false })
  closeAlert = this.actions$.pipe(
    ofType(RTLActions.CLOSE_ALERT),
    map((action: RTLActions.CloseAlert) => {
      this.dialogRef.close();
    }
  ));

  @Effect({ dispatch: false })
  openConfirm = this.actions$.pipe(
    ofType(RTLActions.OPEN_CONFIRMATION),
    map((action: RTLActions.OpenConfirmation) => {
      this.dialogRef = this.dialog.open(ConfirmationMessageComponent, action.payload);
    })
  );

  @Effect({ dispatch: false })
  closeConfirm = this.actions$.pipe(
    ofType(RTLActions.CLOSE_CONFIRMATION),
    take(1),
    map((action: RTLActions.CloseConfirmation) => {
      this.dialogRef.close();
      this.logger.info(action.payload);
      return action.payload;
    }
  ));

  @Effect()
  settingFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_SETTINGS),
    mergeMap((action: RTLActions.FetchSettings) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchSettings'));
      return this.httpClient.get(environment.CONF_API + '/rtlconf');
    }),
    map((rtlConfig: any) => {
      this.logger.info(rtlConfig);
      this.store.dispatch(new RTLActions.SetAuthSettings(rtlConfig.authSettings));
      return {
        type: RTLActions.SET_SETTINGS,
        payload: (undefined !== rtlConfig && undefined !== rtlConfig.settings) ? rtlConfig.settings :
          {'flgSidenavOpened': true, 'flgSidenavPinned': true, 'menu': 'Vertical', 'menuType': 'Regular', 'theme': 'dark-blue', 'satsToBTC': false}
      };
    },
    catchError((err) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchSettings', code: err.status, message: err.error.error }));
      return of();
    })
  ));

  @Effect({ dispatch: false })
  settingSave = this.actions$.pipe(
    ofType(RTLActions.SAVE_SETTINGS),
    mergeMap((action: RTLActions.SaveSettings) => {
      return this.httpClient.post<Settings>(environment.CONF_API, { updatedSettings: action.payload });
    }
  ));

  @Effect()
  infoFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_INFO),
    withLatestFrom(this.store.select('rtlRoot')),
    mergeMap(([action, store]: [RTLActions.FetchInfo, fromRTLReducer.State]) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchInfo'));
      return this.httpClient.get<GetInfo>(environment.GETINFO_API)
      .pipe(
        map((info) => {
          this.logger.info(info);
          if (undefined === info.identity_pubkey) {
            sessionStorage.removeItem('lndUnlocked');
            this.logger.info('Redirecting to Unlock');
            this.router.navigate(['/unlocklnd']);
            return of();
          } else {
            sessionStorage.setItem('lndUnlocked', 'true');
            return {
              type: RTLActions.SET_INFO,
              payload: (undefined !== info) ? info : {}
            };
          }
        }),
        catchError((err) => {
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectError({ action: 'FetchInfo', code: err.status, message: err.error.error }));
          if (+store.authSettings.rtlSSO) {
            this.router.navigate(['/ssoerror']);
          } else {
            if (err.status === 401) {
              this.logger.info('Redirecting to Signin');
              this.router.navigate([store.authSettings.logoutRedirectLink]);
              return of();
            } else {
              this.logger.info('Redirecting to Unlock');
              this.router.navigate(['/unlocklnd']);
              return of();
            }
          }
        })
      );
    }
  ));

  @Effect()
  peersFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_PEERS),
    mergeMap((action: RTLActions.FetchPeers) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchPeers'));
      return this.httpClient.get(environment.PEERS_API)
      .pipe(
        map((peers: any) => {
          this.logger.info(peers);
          return {
            type: RTLActions.SET_PEERS,
            payload: (undefined !== peers) ? peers : []
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.EffectError({ action: 'FetchPeers', code: err.status, message: err.error.error }));
          this.logger.error(err);
          return of();
        })
      );
    }
  ));

  @Effect()
  saveNewPeer = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_PEER),
    mergeMap((action: RTLActions.SaveNewPeer) => {
      return this.httpClient.post(environment.PEERS_API, {pubkey: action.payload.pubkey, host: action.payload.host, perm: action.payload.perm})
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: { type: 'SUCCESS', titleMessage: 'Peer Added Successfully!'}}));
          return {
            type: RTLActions.SET_PEERS,
            payload: (undefined !== postRes && postRes.length > 0) ? postRes : []
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Add Peer Failed',
                message: JSON.stringify({code: err.status, Message: err.error.error})
              }}
            }
          );
        })
      );
    }
  ));

  @Effect()
  detachPeer = this.actions$.pipe(
    ofType(RTLActions.DETACH_PEER),
    mergeMap((action: RTLActions.DetachPeer) => {
      return this.httpClient.delete(environment.PEERS_API + '/' + action.payload.pubkey)
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'SUCCESS', titleMessage: 'Peer Detached Successfully!'}}));
          return {
            type: RTLActions.REMOVE_PEER,
            payload: { pubkey: action.payload.pubkey }
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Unable to Detach Peer. Try again later.',
                message: JSON.stringify({code: err.status, Message: err.error.error})}
              }
            }
          );
        })
      );
    }
  ));

  @Effect()
  saveNewInvoice = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_INVOICE),
    mergeMap((action: RTLActions.SaveNewInvoice) => {
      return this.httpClient.post(environment.INVOICES_API, {memo: action.payload.memo, amount: action.payload.invoiceValue})
      .pipe(
        map((postRes: any) => {
          postRes.memo = action.payload.memo;
          postRes.value = action.payload.invoiceValue;
          postRes.expiry = '3600';
          postRes.cltv_expiry = '144';
          postRes.creation_date = Math.round(new Date().getTime() / 1000).toString();
          postRes.creation_date_str =  new Date(+postRes.creation_date * 1000).toUTCString();
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          const msg = { payment_request: postRes.payment_request };
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%',
          data: { type: 'SUCCESS', titleMessage: 'Invoice Added Successfully!', message: JSON.stringify(msg) }}));
          return {
            type: RTLActions.ADD_INVOICE,
            payload: postRes
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Add Invoice Failed',
                message: JSON.stringify({code: err.status, Message: err.error.error})
              }}
            }
          );
        })
      );
    }
  ));

  @Effect()
  openNewChannel = this.actions$.pipe(
    ofType(RTLActions.SAVE_NEW_CHANNEL),
    mergeMap((action: RTLActions.SaveNewChannel) => {
      return this.httpClient.post(environment.CHANNELS_API, {
        node_pubkey: action.payload.selectedPeerPubkey, local_funding_amount: action.payload.fundingAmount,
        trans_type: action.payload.transType, trans_type_value: action.payload.transTypeValue, spend_unconfirmed: action.payload.spendUnconfirmed
      })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'SUCCESS', titleMessage: 'Channel Added Successfully!'}}));
          this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
          this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all', channelStatus: ''}));
          return {
            type: RTLActions.FETCH_CHANNELS,
            payload: {routeParam: 'pending', channelStatus: ''}
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Open Channel Failed',
                message: JSON.stringify({code: err.status, Message: err.error.error})
              }}
            }
          );
        })
      );
    }
  ));

  @Effect()
  updateChannel = this.actions$.pipe(
    ofType(RTLActions.UPDATE_CHANNELS),
    mergeMap((action: RTLActions.UpdateChannels) => {
      return this.httpClient.post(environment.CHANNELS_API + '/chanPolicy',
        { baseFeeMsat: action.payload.baseFeeMsat, feeRate: action.payload.feeRate, timeLockDelta: action.payload.timeLockDelta, chanPoint: action.payload.chanPoint })
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'SUCCESS', titleMessage: 'Channel Updated Successfully!'}}));
          return {
            type: RTLActions.FETCH_CHANNELS,
            payload: {routeParam: 'all', channelStatus: ''}
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Update Channel Failed',
                message: JSON.stringify({code: err.status, Message: err.error.error})
              }}
            }
          );
        })
      );
    }
  ));

  @Effect()
  closeChannel = this.actions$.pipe(
    ofType(RTLActions.CLOSE_CHANNEL),
    mergeMap((action: RTLActions.CloseChannel) => {
      return this.httpClient.delete(environment.CHANNELS_API + '/' + action.payload.channelPoint + '?force=' + action.payload.forcibly)
      .pipe(
        map((postRes: any) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'SUCCESS', titleMessage: 'Channel Closed Successfully!'}}));
          this.store.dispatch(new RTLActions.FetchBalance('channels'));
          this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
          this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all', channelStatus: ''}));
          if (action.payload.channelStatus) {
            this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'closed', channelStatus: ''}));
          } else {
            this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'pending', channelStatus: ''}));
          }
          return {
            type: RTLActions.REMOVE_CHANNEL,
            payload: { channelPoint: action.payload.channelPoint }
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Unable to Close Channel. Try again later.',
                message: JSON.stringify({code: err.status, Message: err.error.error.message})}}
            }
          );
        })
      );
    }
  ));

  @Effect()
  fetchFees = this.actions$.pipe(
    ofType(RTLActions.FETCH_FEES),
    mergeMap((action: RTLActions.FetchFees) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchFees'));
      return this.httpClient.get<Fees>(environment.FEES_API);
    }),
    map((fees) => {
      this.logger.info(fees);
      return {
        type: RTLActions.SET_FEES,
        payload: (undefined !== fees) ? fees : {}
      };
    }),
    catchError((err: any) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchFees', code: err.status, message: err.error.error }));
      return of();
    }
  ));

  @Effect()
  balanceFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_BALANCE),
    mergeMap((action: RTLActions.FetchBalance) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchBalance/' + action.payload));
      return this.httpClient.get<Balance>(environment.BALANCE_API + '/' + action.payload)
      .pipe(
        map((res: any) => {
          if (action.payload === 'channels') {
            this.store.dispatch(new RTLActions.FetchBalance('blockchain'));
          }
          this.logger.info(res);
          const emptyRes = (action.payload === 'channels') ? {balance: '', btc_balance: ''} : {total_balance: '', btc_total_balance: ''};
          return {
            type: RTLActions.SET_BALANCE,
            payload: (undefined !== res) ? { target: action.payload, balance: res } : { target: action.payload, balance: emptyRes }
          };
        }),
        catchError((err: any) => {
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectError({ action: 'FetchBalance/' + action.payload, code: err.status, message: err.error.error }));
          return of();
        }
      ));
    }
  ));

  @Effect()
  networkInfoFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_NETWORK),
    mergeMap((action: RTLActions.FetchNetwork) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchNetwork'));
      return this.httpClient.get<NetworkInfo>(environment.NETWORK_API + '/info');
    }),
    map((networkInfo) => {
      this.logger.info(networkInfo);
      return {
        type: RTLActions.SET_NETWORK,
        payload: (undefined !== networkInfo) ? networkInfo : {}
      };
    }),
    catchError((err: any) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchNetwork', code: err.status, message: err.error.error }));
      return of();
    }
  ));

  @Effect()
  channelsFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_CHANNELS),
    mergeMap((action: RTLActions.FetchChannels) => {
      const options =
        (undefined === action.payload.channelStatus || action.payload.channelStatus === '') ? {} : { params: new HttpParams().set(action.payload.channelStatus, 'true') };
      return this.httpClient.get(environment.CHANNELS_API + '/' + action.payload.routeParam, options)
      .pipe(
        map((channels: any) => {
          this.logger.info(channels);
          if (action.payload.routeParam === 'pending') {
            return {
              type: RTLActions.SET_PENDING_CHANNELS,
              payload: (undefined !== channels) ? channels : {}
            };
          } else if (action.payload.routeParam === 'closed') {
            return {
              type: RTLActions.SET_CLOSED_CHANNELS,
              payload: (undefined !== channels && undefined !== channels.channels && channels.channels.length > 0) ? channels.channels : []
            };
          } else if (action.payload.routeParam === 'all') {
            return {
              type: RTLActions.SET_CHANNELS,
              payload: (undefined !== channels && undefined !== channels.channels && channels.channels.length > 0) ? channels.channels : []
            };
          }
        },
        catchError((err: any) => {
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectError({ action: 'FetchChannels/' + action.payload.routeParam, code: err.status, message: err.error.error }));
          return of();
        })
      ));
    }
  ));

  @Effect()
  invoicesFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_INVOICES),
    mergeMap((action: RTLActions.FetchInvoices) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchInvoices'));
      return this.httpClient.get<Invoice[]>(environment.INVOICES_API);
    }),
    map((res: any) => {
      this.logger.info(res);
      return {
        type: RTLActions.SET_INVOICES,
        payload: (undefined !== res && undefined !== res.invoices && res.invoices.length > 0) ? res.invoices : []
      };
    }),
    catchError((err: any) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchInvoices', code: err.status, message: err.error.error }));
      return of();
    }
  ));

  @Effect()
  transactionsFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_TRANSACTIONS),
    mergeMap((action: RTLActions.FetchTransactions) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchTransactions'));
      return this.httpClient.get<Transaction[]>(environment.TRANSACTIONS_API);
    }),
    map((transactions) => {
      this.logger.info(transactions);
      return {
        type: RTLActions.SET_TRANSACTIONS,
        payload: (undefined !== transactions && transactions.length > 0) ? transactions : []
      };
    }),
    catchError((err: any) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchTransactions', code: err.status, message: err.error.error }));
      return of();
    }
  ));

  @Effect()
  paymentsFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_PAYMENTS),
    mergeMap((action: RTLActions.FetchPayments) => {
      this.store.dispatch(new RTLActions.ClearEffectError('FetchPayments'));
      return this.httpClient.get<Payment[]>(environment.PAYMENTS_API);
    }),
    map((payments) => {
      this.logger.info(payments);
      return {
        type: RTLActions.SET_PAYMENTS,
        payload: (undefined !== payments) ? payments : []
      };
    }),
    catchError((err: any) => {
      this.logger.error(err);
      this.store.dispatch(new RTLActions.EffectError({ action: 'FetchPayments', code: err.status, message: err.error.error }));
      return of();
    }
  ));

  @Effect()
   decodePayment = this.actions$.pipe(
    ofType(RTLActions.DECODE_PAYMENT),
    mergeMap((action: RTLActions.DecodePayment) => {
      return this.httpClient.get(environment.PAYREQUEST_API + '/' + action.payload)
      .pipe(
        map((decodedPayment) => {
          this.logger.info(decodedPayment);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_DECODED_PAYMENT,
            payload: (undefined !== decodedPayment) ? decodedPayment : {}
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Decode Payment Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error, URL: environment.PAYREQUEST_API + '/' + action.payload})}}
            }
          );
        })
      );
    })
  );

  @Effect({ dispatch: false })
  setDecodedPayment = this.actions$.pipe(
    ofType(RTLActions.SET_DECODED_PAYMENT),
    map((action: RTLActions.SetDecodedPayment) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  sendPayment = this.actions$.pipe(
    ofType(RTLActions.SEND_PAYMENT),
    withLatestFrom(this.store.select('rtlRoot')),
    mergeMap(([action, store]: [RTLActions.SendPayment, fromRTLReducer.State]) => {
    let queryHeaders = {};
    if (action.payload[2]) {
      queryHeaders = {paymentDecoded: action.payload[1]};
    } else {
      queryHeaders = {paymentReq: action.payload[0]};
    }
    return this.httpClient.post(environment.CHANNELS_API + '/transactions', queryHeaders)
    .pipe(
      map((sendRes: any) => {
        this.logger.info(sendRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        if (sendRes.payment_error) {
          this.logger.error('Error: ' + sendRes.payment_error);
          return of({
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Send Payment Failed',
            message: JSON.stringify(
              {code: sendRes.payment_error.status, Message: sendRes.payment_error.error.message, URL: environment.CHANNELS_API + '/transactions/' + action.payload[0]}
            )
          }}
          });
        } else {
          const confirmationMsg = { 'Destination': action.payload[1].destination, 'Timestamp': action.payload[1].timestamp_str, 'Expiry': action.payload[1].expiry };
          confirmationMsg['Amount (' + ((undefined === store.information.smaller_currency_unit) ?
            'Sats' :  store.information.smaller_currency_unit) + ')'] = action.payload[1].num_satoshis;
          const msg = {};
          msg['Total Fee (' + ((undefined === store.information.smaller_currency_unit) ? 'Sats' : store.information.smaller_currency_unit) + ')'] =
            (sendRes.payment_route.total_fees_msat / 1000);
          Object.assign(msg, confirmationMsg);
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%',
            data: { type: 'SUCCESS', titleMessage: 'Payment Sent Successfully!', message: JSON.stringify(msg) }}));
          this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all', channelStatus: ''}));
          this.store.dispatch(new RTLActions.FetchPayments());
          return {
            type: RTLActions.SET_DECODED_PAYMENT,
            payload: {}
          };
        }
      }),
      catchError((err: any) => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.logger.error(err);
        return of(
          {
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Send Payment Failed',
              message: JSON.stringify({code: err.status, Message: err.error.error, URL: environment.CHANNELS_API + '/transactions/' + action.payload[0]})}}
          }
        );
      })
    );
    })
  );

  @Effect()
  graphNodeFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_GRAPH_NODE),
    mergeMap((action: RTLActions.FetchGraphNode) => {
      return this.httpClient.get<GraphNode>(environment.NETWORK_API + '/node/' + action.payload)
      .pipe(map((graphNode: any) => {
        this.logger.info(graphNode);
        this.store.dispatch(new RTLActions.CloseSpinner());
        return {
          type: RTLActions.SET_GRAPH_NODE,
          payload: (undefined !== graphNode) ? graphNode : {}
        };
      }),
      catchError((err: any) => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.logger.error(err);
        return of(
          {
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Get Node Address Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error})}}
          }
        );
      }));
    }
  ));

  @Effect({ dispatch: false })
  setGraphNode = this.actions$.pipe(
    ofType(RTLActions.SET_GRAPH_NODE),
    map((action: RTLActions.SetGraphNode) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

 @Effect()
  getNewAddress = this.actions$.pipe(
    ofType(RTLActions.GET_NEW_ADDRESS),
    mergeMap((action: RTLActions.GetNewAddress) => {
    return this.httpClient.get(environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId)
      .pipe(map((newAddress: any) => {
        this.logger.info(newAddress);
        this.store.dispatch(new RTLActions.CloseSpinner());
        return {
          type: RTLActions.SET_NEW_ADDRESS,
          payload: (undefined !== newAddress && undefined !== newAddress.address) ? newAddress.address : {}
        };
      }),
      catchError((err: any) => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.logger.error(err);
        return of(
          {
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Generate New Address Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error, URL: environment.NEW_ADDRESS_API + '?type=' + action.payload.addressId})}}
          }
        );
      }));
    })
  );

  @Effect({ dispatch: false })
  setNewAddress = this.actions$.pipe(
    ofType(RTLActions.SET_NEW_ADDRESS),
    map((action: RTLActions.SetNewAddress) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  configFetch = this.actions$.pipe(
    ofType(RTLActions.FETCH_CONFIG),
    mergeMap((action: RTLActions.FetchConfig) => {
      this.store.dispatch(new RTLActions.ClearEffectError('fetchConfig'));
      return this.httpClient.get(environment.CONF_API + '/config/' + action.payload)
      .pipe(
        map((configFile: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SHOW_CONFIG,
            payload: configFile
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.logger.error(err);
          this.store.dispatch(new RTLActions.EffectError({ action: 'fetchConfig', code: err.status, message: err.error.error }));
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Fetch Config Failed!',
              message: JSON.stringify({Code: err.status, Message: err.error.error})}}
            }
          );
        }
      ));
    })
  );

  @Effect({ dispatch: false })
  showLNDConfig = this.actions$.pipe(
    ofType(RTLActions.SHOW_CONFIG),
    map((action: RTLActions.ShowConfig) => {
      this.logger.info(action.payload);
      return action.payload;
    })
  );

  @Effect()
  SetChannelTransaction = this.actions$.pipe(
    ofType(RTLActions.SET_CHANNEL_TRANSACTION),
    mergeMap((action: RTLActions.SetChannelTransaction) => {
    this.store.dispatch(new RTLActions.ClearEffectError('SetChannelTransaction'));
    return this.httpClient.post(environment.TRANSACTIONS_API,
      { amount: action.payload.amount, address: action.payload.address, sendAll: action.payload.sendAll, fees: action.payload.fees, blocks: action.payload.blocks }
    )
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.store.dispatch(new RTLActions.CloseSpinner());
        return {
          type: RTLActions.OPEN_ALERT,
          payload: { data: {type: 'SUCCESS', titleMessage: 'Fund Sent Successfully!'} }
        };
      }),
      catchError((err: any) => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.EffectError({ action: 'SetChannelTransaction', code: err.status, message: err.error.error }));
        this.logger.error(err);
        return of(
          {
            type: RTLActions.OPEN_ALERT,
            payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Sending Fund Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error})}}
          }
        );
      }));
    })
  );

  @Effect()
  fetchForwardingHistory = this.actions$.pipe(
    ofType(RTLActions.GET_FORWARDING_HISTORY),
    mergeMap((action: RTLActions.GetForwardingHistory) => {
      this.store.dispatch(new RTLActions.ClearEffectError('GetForwardingHistory'));
      const queryHeaders: SwitchReq = {
        num_max_events: action.payload.num_max_events, index_offset: action.payload.index_offset, end_time: action.payload.end_time , start_time: action.payload.start_time
      };
      return this.httpClient.post(environment.SWITCH_API, queryHeaders)
      .pipe(
        map((fhRes: any) => {
          this.logger.info(fhRes);
          return {
            type: RTLActions.SET_FORWARDING_HISTORY,
            payload: fhRes
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.EffectError({ action: 'GetForwardingHistory', code: err.status, message: err.error.error }));
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Get Forwarding History Failed',
                message: JSON.stringify({code: err.status, Message: err.error.error, URL: environment.SWITCH_API})}}
            }
          );
        })
      );
    })
  );

  @Effect({ dispatch : false })
  operateWallet = this.actions$.pipe(
    ofType(RTLActions.OPERATE_WALLET),
    mergeMap((action: RTLActions.OperateWallet) => {
      return this.httpClient.post(environment.WALLET_API + '/' + action.payload.operation, { wallet_password: action.payload.pwd })
      .pipe(
        map((postRes) => {
          this.logger.info(postRes);
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenSpinner('Initializing Node...'));
          this.logger.info('Successfully Unlocked!');
          sessionStorage.setItem('lndUnlocked', 'true');
          setTimeout(() => {
            this.store.dispatch(new RTLActions.CloseSpinner());
            this.logger.info('Successfully Initialized!');
            this.store.dispatch(new RTLActions.InitAppData());
            this.router.navigate(['/']);
          }, 1000 * 90);
          return of({});
        }),
        catchError((err) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', titleMessage: err.error.error}}));
          this.logger.error(err.error.error);
          return of();
        })
      );
    }
  ));

  @Effect()
  isAuthorized = this.actions$.pipe(
    ofType(RTLActions.IS_AUTHORIZED),
    withLatestFrom(this.store.select('rtlRoot')),
    mergeMap(([action, store]: [RTLActions.IsAuthorized, fromRTLReducer.State]) => {
      this.store.dispatch(new RTLActions.ClearEffectError('IsAuthorized'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { password: action.payload })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        return {
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: postRes
        };
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', titleMessage: 'Authorization Failed',
         message: JSON.stringify({Code: err.status, Message: err.error.error})}}));
        this.store.dispatch(new RTLActions.EffectError({ action: 'IsAuthorized', code: err.status, message: err.error.message }));
        this.logger.error(err.error);
        return of({
          type: RTLActions.IS_AUTHORIZED_RES,
          payload: 'ERROR'
        });
      })
    );
  }));

  @Effect({ dispatch: false })
  isAuthorizedRes = this.actions$.pipe(
   ofType(RTLActions.IS_AUTHORIZED_RES),
   map((action: RTLActions.IsAuthorizedRes) => {
     return action.payload;
   })
  );

  @Effect({ dispatch: false })
  authSignin = this.actions$.pipe(
  ofType(RTLActions.SIGNIN),
  withLatestFrom(this.store.select('rtlRoot')),
  mergeMap(([action, store]: [RTLActions.Signin, fromRTLReducer.State]) => {
    this.store.dispatch(new RTLActions.ClearEffectError('Signin'));
    return this.httpClient.post(environment.AUTHENTICATE_API, { password: action.payload })
    .pipe(
      map((postRes: any) => {
        this.logger.info(postRes);
        this.logger.info('Successfully Authorized!');
        this.SetToken(postRes.token);
        this.router.navigate(['/']);
      }),
      catchError((err) => {
        this.store.dispatch(new RTLActions.OpenAlert({ width: '70%', data: {type: 'ERROR', message: JSON.stringify(err.error)}}));
        this.store.dispatch(new RTLActions.EffectError({ action: 'Signin', code: err.status, message: err.error.message }));
        this.logger.error(err.error);
        this.logger.info('Redirecting to Signin Error Page');
        if (+store.authSettings.rtlSSO) {
          this.router.navigate(['/ssoerror']);
        } else {
          this.router.navigate([store.authSettings.logoutRedirectLink]);
        }
        return of();
      })
    );
  }));

  @Effect({ dispatch: false })
  signOut = this.actions$.pipe(
  ofType(RTLActions.SIGNOUT),
  withLatestFrom(this.store.select('rtlRoot')),
  mergeMap(([action, store]: [RTLActions.Signout, fromRTLReducer.State]) => {
    if (+store.authSettings.rtlSSO) {
      window.location.href = store.authSettings.logoutRedirectLink;
    } else {
      this.router.navigate([store.authSettings.logoutRedirectLink]);
    }
    sessionStorage.removeItem('lndUnlocked');
    sessionStorage.removeItem('token');
    this.logger.warn('LOGGED OUT');
    return of();
  }));

  @Effect()
  peerLookup = this.actions$.pipe(
    ofType(RTLActions.PEER_LOOKUP),
    mergeMap((action: RTLActions.PeerLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(environment.NETWORK_API + '/node/' + action.payload)
      .pipe(
        map((resPeer) => {
          this.logger.info(resPeer);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_LOOKUP,
            payload: resPeer
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Peer Lookup Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error, URL: environment.NETWORK_API + '/node/' + action.payload})}}
            }
          );
        })
      );
    })
  );

  @Effect()
  channelLookup = this.actions$.pipe(
    ofType(RTLActions.CHANNEL_LOOKUP),
    mergeMap((action: RTLActions.ChannelLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(environment.NETWORK_API + '/edge/' + action.payload)
      .pipe(
        map((resChannel) => {
          this.logger.info(resChannel);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_LOOKUP,
            payload: resChannel
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Channel Lookup Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error, URL: environment.NETWORK_API + '/edge/' + action.payload})}}
            }
          );
        })
      );
    })
  );

  @Effect()
  invoiceLookup = this.actions$.pipe(
    ofType(RTLActions.INVOICE_LOOKUP),
    mergeMap((action: RTLActions.InvoiceLookup) => {
      this.store.dispatch(new RTLActions.ClearEffectError('Lookup'));
      return this.httpClient.get(environment.INVOICES_API + '/' + action.payload)
      .pipe(
        map((resInvoice) => {
          this.logger.info(resInvoice);
          this.store.dispatch(new RTLActions.CloseSpinner());
          return {
            type: RTLActions.SET_LOOKUP,
            payload: resInvoice
          };
        }),
        catchError((err: any) => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.store.dispatch(new RTLActions.EffectError({ action: 'Lookup', code: err.status, message: err.error.message }));
          this.logger.error(err);
          return of(
            {
              type: RTLActions.OPEN_ALERT,
              payload: { width: '70%', data: {type: 'ERROR', titleMessage: 'Invoice Lookup Failed',
              message: JSON.stringify({Code: err.status, Message: err.error.error, URL: environment.INVOICES_API + '/' + action.payload})}}
            }
          );
        })
      );
    })
  );

  @Effect({ dispatch: false })
  setLookup = this.actions$.pipe(
   ofType(RTLActions.SET_LOOKUP),
   map((action: RTLActions.SetLookup) => {
     this.logger.info(action.payload);
     return action.payload;
   })
 );

  SetToken(token: string) {
    if (token) {
      sessionStorage.setItem('lndUnlocked', 'true');
      sessionStorage.setItem('token', token);
      this.store.dispatch(new RTLActions.InitAppData());
    } else {
      sessionStorage.removeItem('lndUnlocked');
      sessionStorage.removeItem('token');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
