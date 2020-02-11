import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Actions, act } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ChannelInformation } from '../../../models/alertData';
import { LoggerService } from '../../../services/logger.service';
import { Channel, QueryRoutes } from '../../../models/lndModels';
import { FEE_LIMIT_TYPES, PAGE_SIZE } from '../../../services/consts-enums-functions';

import { LNDEffects } from '../../../../lnd/store/lnd.effects';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss']
})
export class ChannelRebalanceComponent implements OnInit, OnDestroy {
  public faInfoCircle = faInfoCircle;
  public selChannel: Channel = {};
  public activeChannels = [];
  public feeLimitTypes = [];
  public queryRoute: QueryRoutes = {};
  public paymentRequest = '';
  public paymentStatus: any = null;
  public flgInvoiceGenerated = false;
  public flgPaymentSent = false;
  isLinear = false;
  inputFormGroup: FormGroup;
  feeFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ChannelRebalanceComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelInformation, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private lndEffects: LNDEffects, private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.selChannel = this.data.channel;
    FEE_LIMIT_TYPES.forEach((FEE_LIMIT_TYPE, i) => {
      if(i > 0) {
        this.feeLimitTypes.push(FEE_LIMIT_TYPE);
      }
    });
    this.inputFormGroup = this.formBuilder.group({
      rebalanceAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.selChannel.local_balance)]],
      selRebalancePeer: [null, Validators.required]
    });
    this.feeFormGroup = this.formBuilder.group({
      selFeeLimitType: [this.feeLimitTypes[0], Validators.required],
      feeLimit: ['', [Validators.required, Validators.min(0)]]
    });    
    this.statusFormGroup = this.formBuilder.group({
      thirdCtrl: ['', Validators.required]
    }); 
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.active && channel.remote_balance >= this.inputFormGroup.controls.rebalanceAmount.value && channel.chan_id !== this.selChannel.chan_id);
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.SET_QUERY_ROUTES || action.type === RTLActions.SEND_PAYMENT_STATUS || action.type === RTLActions.NEWLY_SAVED_INVOICE))
    .subscribe((action: (RTLActions.SetQueryRoutes | RTLActions.SendPaymentStatus | RTLActions.NewlySavedInvoice)) => {
      if (action.type === RTLActions.SET_QUERY_ROUTES) { this.queryRoute = action.payload; }     
      if (action.type === RTLActions.SEND_PAYMENT_STATUS) { 
        this.logger.info(action.payload);
        this.flgPaymentSent = true;
        this.paymentStatus = action.payload;
      }
      if (action.type === RTLActions.NEWLY_SAVED_INVOICE) { 
        this.logger.info(action.payload);
        this.flgInvoiceGenerated = true;
        this.paymentRequest = action.payload.paymentRequest;
        this.store.dispatch(new RTLActions.SendPayment({paymentReq: action.payload.paymentRequest, paymentDecoded: {}, zeroAmtInvoice: false, outgoingChannel: this.selChannel, feeLimitType: this.feeFormGroup.controls.selFeeLimitType.value, feeLimit: this.feeFormGroup.controls.feeLimit.value, allowSelfPayment: true, lastHopPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey}));
      }
    });
  }

  onEstimateFee() {
    if(!this.inputFormGroup.controls.selRebalancePeer.value || !this.inputFormGroup.controls.rebalanceAmount.value) { return true; }
    this.queryRoute = null;
    this.feeFormGroup.reset();
    this.feeFormGroup.controls.selFeeLimitType.setValue(this.feeLimitTypes[0]);
    this.store.dispatch(new RTLActions.GetQueryRoutes({destPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey, amount: this.inputFormGroup.controls.rebalanceAmount.value, outgoingChanId: this.selChannel.chan_id}));
  }

  onUseEstimate() {
    this.feeFormGroup.controls.selFeeLimitType.setValue(this.feeLimitTypes[0]);
    this.feeFormGroup.controls.feeLimit.setValue((this.queryRoute.routes && this.queryRoute.routes.length > 0 && this.queryRoute.routes[0].total_fees) ? this.queryRoute.routes[0].total_fees : 0);
  }

  onRebalance() {
    if (!this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.rebalanceAmount.value <= 0 || this.inputFormGroup.controls.rebalanceAmount.value > +this.selChannel.local_balance || this.feeFormGroup.controls.feeLimit.value < 0 || !this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey) { return true; }
    this.paymentRequest = '';
    this.paymentStatus = null;
    this.flgInvoiceGenerated = false;
    this.flgPaymentSent = false;      
    this.store.dispatch(new RTLActions.SaveNewInvoice({
      memo: 'Local-Rebalance-' + this.inputFormGroup.controls.rebalanceAmount.value + '-Sats', invoiceValue: this.inputFormGroup.controls.rebalanceAmount.value, private: false, expiry: 3600, pageSize: PAGE_SIZE, openModal: false
    }));
  }

  filterActiveChannels() {
    this.activeChannels = this.activeChannels.filter(channel => channel.remote_balance >= this.inputFormGroup.controls.rebalanceAmount.value && channel.chan_id !== this.selChannel.chan_id);
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
