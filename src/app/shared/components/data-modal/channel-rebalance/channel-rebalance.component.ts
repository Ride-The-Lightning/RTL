import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

import { Channel } from '../../../models/lndModels';
import { FEE_LIMIT_TYPES } from '../../../services/consts-enums-functions';
import { ChannelRebalanceInformation } from '../../../models/alertData';

@Component({
  selector: 'rtl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss']
})
export class ChannelRebalanceComponent implements OnInit, OnDestroy {
  public rebalanceAmount = 0;
  public selRebalanceChannel: Channel = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;

  constructor(public dialogRef: MatDialogRef<ChannelRebalanceComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelRebalanceInformation) { }

  ngOnInit() {
    console.warn(this.data);
  }

  onRebalance() {
    console.warn('HERE');
    // Invoices => Local-Rebalance-10000-Sats
    // this.store.dispatch(new RTLActions.SaveNewInvoice({
    //   memo: this.memo, invoiceValue: this.invoiceValue, private: this.private, expiry: expiryInSecs, pageSize: this.pageSize
    // }));
    // this.activeChannels = rtlStore.allChannels.filter(channel => channel.active);
    // this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
    // this.store.dispatch(new RTLActions.SendPayment({paymentReq: this.paymentRequest, paymentDecoded: this.paymentDecoded, zeroAmtInvoice: true, outgoingChannel: this.selActiveChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit}));
  }

  resetData() {
    this.rebalanceAmount = 0;
    this.feeLimit = null;
    this.selFeeLimitType = FEE_LIMIT_TYPES[0];
  }

  ngOnDestroy() {}
}
