import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { ChannelRebalanceInformation } from '../../../models/alertData';
import { LoggerService } from '../../../services/logger.service';
import { Channel } from '../../../models/lndModels';
import { FEE_LIMIT_TYPES, PAGE_SIZE } from '../../../services/consts-enums-functions';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss']
})
export class ChannelRebalanceComponent implements OnInit, OnDestroy {
  public selChannel: Channel = {};
  public rebalanceAmount = 0;
  public selRebalancePeer: Channel = {};
  public activeChannels = [];
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ChannelRebalanceComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelRebalanceInformation, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) { }

  ngOnInit() {
    console.warn(this.data);
    this.selChannel = this.data.channel;
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.active && channel.remote_balance >= this.rebalanceAmount && channel.chan_id !== this.selChannel.chan_id);
      this.logger.info(rtlStore);
    });
  }

  onRebalance() {
    this.store.dispatch(new RTLActions.OpenSpinner('Creating Invoice to Rebalance...'));
    this.store.dispatch(new RTLActions.SaveNewInvoice({
      memo: 'Local-Rebalance-' + this.rebalanceAmount + '-Sats', invoiceValue: this.rebalanceAmount, private: false, expiry: 3600, pageSize: PAGE_SIZE, openModal: false
    }));
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.NEWLY_SAVED_INVOICE))
    .subscribe((action: RTLActions.NewlySavedInvoice) => {
      this.logger.info(action.payload);
      this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment to Rebalance...'));
      this.store.dispatch(new RTLActions.SendPayment({paymentReq: action.payload.paymentRequest, paymentDecoded: {}, zeroAmtInvoice: false, outgoingChannel: this.selChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit, allowSelfPayment: true, lastHopPubkey: this.selRebalancePeer.remote_pubkey}));
      this.dialogRef.close(false);
    });
  }

  filterActiveChannels() {
    this.activeChannels = this.activeChannels.filter(channel => channel.remote_balance >= this.rebalanceAmount && channel.chan_id !== this.selChannel.chan_id);
  }

  resetData() {
    this.rebalanceAmount = 0;
    this.feeLimit = null;
    this.selFeeLimitType = FEE_LIMIT_TYPES[0];
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
