import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, NgModel } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { PayRequest, Channel, ChannelsSummary, LightningBalance } from '../../../shared/models/lndModels';
import { APICallStatusEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES, LNDActions, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { RTLState } from '../../../store/rtl.state';
import { sendPayment } from '../../store/lnd.actions';
import { channels, lndNodeSettings } from '../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss']
})
export class LightningSendPaymentsComponent implements OnInit, OnDestroy {

  @ViewChild('paymentReq', { static: false }) paymentReq: NgModel;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public showAdvanced = false;
  public activeChannels = [];
  public filteredMinAmtActvChannels: Channel[] = [];
  public selectedChannelCtrl = new FormControl();
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public advancedTitle = 'Advanced Options';
  public paymentError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LightningSendPaymentsComponent>, private store: Store<RTLState>, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions, private dataService: DataService) { }

  ngOnInit() {
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => { this.selNode = nodeSettings; });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.activeChannels = channelsSelector.channels.filter((channel) => channel.active);
        this.filteredMinAmtActvChannels = this.activeChannels;
        if (this.filteredMinAmtActvChannels.length && this.filteredMinAmtActvChannels.length > 0) {
          this.selectedChannelCtrl.enable();
        } else {
          this.selectedChannelCtrl.disable();
        }
        this.logger.info(channelsSelector);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === LNDActions.UPDATE_API_CALL_STATUS_LND || action.type === LNDActions.SEND_PAYMENT_STATUS_LND)).
      subscribe((action: any) => {
        if (action.type === LNDActions.SEND_PAYMENT_STATUS_LND) {
          this.dialogRef.close();
        }
        if (action.type === LNDActions.UPDATE_API_CALL_STATUS_LND && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.num_satoshis;
          this.paymentError = action.payload.message;
        }
      });
    let x = '';
    let y = '';
    this.activeChannels = this.activeChannels.sort((c1: Channel, c2: Channel) => {
      x = c1.remote_alias ? c1.remote_alias.toLowerCase() : c1.chan_id ? c1.chan_id.toLowerCase() : '';
      y = c2.remote_alias ? c2.remote_alias.toLowerCase() : c2.chan_id ? c2.chan_id.toLowerCase() : '';
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.selectedChannelCtrl.valueChanges.pipe(takeUntil(this.unSubs[3])).
      subscribe((channel) => {
        if (typeof channel === 'string') {
          this.filteredMinAmtActvChannels = this.filterChannels();
        }
      });
  }

  private filterChannels(): Channel[] {
    return this.activeChannels.filter((channel) => {
      const alias = channel.remote_alias ? channel.remote_alias.toLowerCase() : channel.chan_id ? channel.chan_id.toLowerCase() : '';
      return alias.indexOf(this.selectedChannelCtrl.value ? this.selectedChannelCtrl.value.toLowerCase() : '') === 0 && channel.local_balance >= +(this.paymentDecoded.num_satoshis ? this.paymentDecoded.num_satoshis : 0);
    });
  }

  displayFn(channel: Channel): string {
    return (channel && channel.remote_alias) ? channel.remote_alias : (channel && channel.chan_id) ? channel.chan_id : '';
  }

  onSelectedChannelChanged() {
    if (this.selectedChannelCtrl.value && this.selectedChannelCtrl.value.length > 0 && typeof this.selectedChannelCtrl.value === 'string') {
      const foundChannels = this.activeChannels.filter((channel) => {
        const alias = channel.remote_alias ? channel.remote_alias.toLowerCase() : channel.chan_id ? channel.chan_id.toLowerCase() : '';
        return alias.length === this.selectedChannelCtrl.value.length && alias.indexOf(this.selectedChannelCtrl.value ? this.selectedChannelCtrl.value.toLowerCase() : '') === 0;
      });
      if (foundChannels && foundChannels.length > 0) {
        this.selectedChannelCtrl.setValue(foundChannels[0]);
        this.selectedChannelCtrl.setErrors(null);
      } else {
        this.selectedChannelCtrl.setErrors({ notfound: true });
      }
    }
  }

  onSendPayment(): boolean | void {
    if (this.selectedChannelCtrl.value && typeof this.selectedChannelCtrl.value === 'string') {
      this.onSelectedChannelChanged();
    }
    if (!this.paymentRequest || (this.zeroAmtInvoice && (!this.paymentAmount || this.paymentAmount <= 0)) || typeof this.selectedChannelCtrl.value === 'string') {
      return true;
    }
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.onPaymentRequestEntry(this.paymentRequest);
    }
  }

  sendPayment(): boolean | void {
    if (this.selFeeLimitType !== this.feeLimitTypes[0] && !this.feeLimit) {
      return true;
    }
    if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
      this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
    }
    if (!this.paymentDecoded.num_satoshis || this.paymentDecoded.num_satoshis === '' || this.paymentDecoded.num_satoshis === '0') {
      this.zeroAmtInvoice = true;
      this.paymentDecoded.num_satoshis = this.paymentAmount;
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentReq: this.paymentRequest, paymentAmount: this.paymentAmount, outgoingChannel: this.selectedChannelCtrl.value, feeLimitType: this.selFeeLimitType.id, feeLimit: this.feeLimit, fromDialog: true } }));
    } else {
      this.zeroAmtInvoice = false;
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentReq: this.paymentRequest, outgoingChannel: this.selectedChannelCtrl.value, feeLimitType: this.selFeeLimitType.id, feeLimit: this.feeLimit, fromDialog: true } }));
    }
  }

  onAmountChange(event: any) {
    delete this.paymentDecoded.num_satoshis;
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentAmount = null;
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.dataService.decodePayment(this.paymentRequest, true).
        pipe(take(1)).subscribe({
          next: (decodedPayment: PayRequest) => {
            this.paymentDecoded = decodedPayment;
            this.selectedChannelCtrl.setValue(null);
            this.onAdvancedPanelToggle(true, true);
            if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
              this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
            }
            if (this.paymentDecoded.num_satoshis && this.paymentDecoded.num_satoshis !== '' && this.paymentDecoded.num_satoshis !== '0') {
              this.filteredMinAmtActvChannels = this.filterChannels();
              if (this.filteredMinAmtActvChannels.length && this.filteredMinAmtActvChannels.length > 0) {
                this.selectedChannelCtrl.enable();
              } else {
                this.selectedChannelCtrl.disable();
              }
              this.zeroAmtInvoice = false;
              if (this.selNode.fiatConversion) {
                this.commonService.convertCurrency(+this.paymentDecoded.num_satoshis, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
                  pipe(takeUntil(this.unSubs[4])).
                  subscribe({
                    next: (data) => {
                      this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats (' + data.symbol + ' ' + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
                    }, error: (error) => {
                      this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None') + '. Unable to convert currency.';
                    }
                  });
              } else {
                this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
              }
            } else {
              this.zeroAmtInvoice = true;
              this.filteredMinAmtActvChannels = this.activeChannels;
              if (this.filteredMinAmtActvChannels.length && this.filteredMinAmtActvChannels.length > 0) {
                this.selectedChannelCtrl.enable();
              } else {
                this.selectedChannelCtrl.disable();
              }
              this.paymentDecodedHint = 'Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
            }
          }, error: (err) => {
            this.logger.error(err);
            this.paymentDecodedHint = 'ERROR: ' + err.message;
            this.paymentReq.control.setErrors({ decodeError: true });
          }
        });
    }
  }

  onAdvancedPanelToggle(isClosed: boolean, isReset: boolean) {
    if (isClosed && !isReset) {
      const alias = (this.selectedChannelCtrl.value && this.selectedChannelCtrl.value.remote_alias) ? this.selectedChannelCtrl.value.remote_alias : (this.selectedChannelCtrl.value && this.selectedChannelCtrl.value.chan_id) ? this.selectedChannelCtrl.value.chan_id : '';
      this.advancedTitle = 'Advanced Options | ' + this.selFeeLimitType.name + (this.selFeeLimitType.id === 'none' ? '' : (': ' + this.feeLimit)) + ((alias !== '') ? ' | First Outgoing Channel: ' + alias : '');
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.selectedChannelCtrl.setValue(null);
    this.filteredMinAmtActvChannels = this.activeChannels;
    if (this.filteredMinAmtActvChannels.length && this.filteredMinAmtActvChannels.length > 0) {
      this.selectedChannelCtrl.enable();
    } else {
      this.selectedChannelCtrl.disable();
    }
    this.feeLimit = null;
    this.selFeeLimitType = FEE_LIMIT_TYPES[0];
    this.advancedTitle = 'Advanced Options';
    this.zeroAmtInvoice = false;
    this.paymentReq.control.setErrors(null);
    this.paymentError = '';
    this.paymentDecodedHint = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
