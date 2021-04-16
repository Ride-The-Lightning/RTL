import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ChannelInformation } from '../../../../shared/models/alertData';
import { LoggerService } from '../../../../shared/services/logger.service';
import { Channel, QueryRoutes, ListInvoices } from '../../../../shared/models/lndModels';
import { FEE_LIMIT_TYPES, PAGE_SIZE } from '../../../../shared/services/consts-enums-functions';

import * as LNDActions from '../../../store/lnd.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss']
})
export class ChannelRebalanceComponent implements OnInit, OnDestroy {
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faInfoCircle = faInfoCircle;
  public invoices: ListInvoices = {};
  public selChannel: Channel = {};
  public activeChannels = [];
  public filteredActiveChannels = [];
  public feeLimitTypes = [];
  public queryRoute: QueryRoutes = {};
  public paymentRequest = '';
  public paymentStatus: any = null;
  public flgReusingInvoice = false;
  public flgInvoiceGenerated = false;
  public flgPaymentSent = false;
  public inputFormLabel = 'Amount to rebalance';
  public feeFormLabel = 'Select rebalance fee';
  public flgEditable = true;
  inputFormGroup: FormGroup;
  feeFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ChannelRebalanceComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelInformation, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe) { }

  ngOnInit() {
    this.selChannel = this.data.channel;
    FEE_LIMIT_TYPES.forEach((FEE_LIMIT_TYPE, i) => {
      if(i > 0) {
        this.feeLimitTypes.push(FEE_LIMIT_TYPE);
      }
    });
    // hiddenAmount & hiddenFeeLimit are temporary hacks to overcome material steppers stepChanged event shortcoming.
    // User should be able to go to next step only by clicking the action button on the step.
    this.inputFormGroup = this.formBuilder.group({
      hiddenAmount: ['', [Validators.required]],
      rebalanceAmount: ['', [Validators.required, Validators.min(1), Validators.max(this.selChannel.local_balance)]],
      selRebalancePeer: [null, Validators.required]
    });
    this.feeFormGroup = this.formBuilder.group({
      selFeeLimitType: [this.feeLimitTypes[0], Validators.required],
      feeLimit: ['', [Validators.required, Validators.min(0)]],
      hiddenFeeLimit: ['', [Validators.required]]
    });    
    this.statusFormGroup = this.formBuilder.group({}); 
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.active && channel.remote_balance >= this.inputFormGroup.controls.rebalanceAmount.value && channel.chan_id !== this.selChannel.chan_id);
      this.invoices = rtlStore.invoices;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === LNDActions.SET_QUERY_ROUTES_LND || action.type === LNDActions.SEND_PAYMENT_STATUS_LND || action.type === LNDActions.NEWLY_SAVED_INVOICE_LND))
    .subscribe((action: (LNDActions.SetQueryRoutes | LNDActions.SendPaymentStatus | LNDActions.NewlySavedInvoice)) => {
      if (action.type === LNDActions.SET_QUERY_ROUTES_LND) { this.queryRoute = action.payload; }     
      if (action.type === LNDActions.SEND_PAYMENT_STATUS_LND) { 
        this.logger.info(action.payload);
        this.flgPaymentSent = true;
        this.paymentStatus = action.payload;
        this.flgEditable = true;        
      }
      if (action.type === LNDActions.NEWLY_SAVED_INVOICE_LND) { 
        this.logger.info(action.payload);
        this.flgInvoiceGenerated = true;
        this.sendPayment(action.payload.paymentRequest);
      }
    });
  }

  onEstimateFee():boolean|void {
    if(!this.inputFormGroup.controls.selRebalancePeer.value || !this.inputFormGroup.controls.rebalanceAmount.value) { return true; }
    if (this.stepper.selectedIndex === 0) {
      this.inputFormGroup.controls.hiddenAmount.setValue(this.inputFormGroup.controls.rebalanceAmount.value);
      this.stepper.next();
    }
    this.queryRoute = null;
    this.feeFormGroup.reset();
    this.feeFormGroup.controls.selFeeLimitType.setValue(this.feeLimitTypes[0]);
    this.store.dispatch(new LNDActions.GetQueryRoutes({destPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey, amount: this.inputFormGroup.controls.rebalanceAmount.value, outgoingChanId: this.selChannel.chan_id}));
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to rebalance';
        this.feeFormLabel = 'Select rebalance fee';
        break;
    
      case 1:
        if (this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.selRebalancePeer.value.remote_alias) {
          this.inputFormLabel = 'Rebalancing Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.rebalanceAmount.value ? this.inputFormGroup.controls.rebalanceAmount.value : 0)) + ' Sats | Peer: ' + (this.inputFormGroup.controls.selRebalancePeer.value.remote_alias ? this.inputFormGroup.controls.selRebalancePeer.value.remote_alias : (this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey.substring(0, 15) + '...'));
        } else {
          this.inputFormLabel = 'Amount to rebalance';
        }
        this.feeFormLabel = 'Select rebalance fee';
        break;

      case 2:
        if (this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.selRebalancePeer.value.remote_alias) {
          this.inputFormLabel = 'Rebalancing Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.rebalanceAmount.value ? this.inputFormGroup.controls.rebalanceAmount.value : 0)) + ' Sats | Peer: ' + (this.inputFormGroup.controls.selRebalancePeer.value.remote_alias ? this.inputFormGroup.controls.selRebalancePeer.value.remote_alias : (this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey.substring(0, 15) + '...'));
        } else {
          this.inputFormLabel = 'Amount to rebalance';
        }
        if (this.queryRoute && this.queryRoute.routes && this.queryRoute.routes.length > 0 && (this.queryRoute.routes[0].total_fees_msat || (this.queryRoute.routes[0].hops && this.queryRoute.routes[0].hops.length))) {
          this.feeFormLabel = this.feeFormGroup.controls.selFeeLimitType.value.placeholder + ': ' + this.decimalPipe.transform(this.feeFormGroup.controls.feeLimit.value ? this.feeFormGroup.controls.feeLimit.value : 0) + ' | Hops: ' + this.queryRoute.routes[0].hops.length;
        } else {
          this.feeFormLabel = 'Select rebalance fee';
        }
        break;

      default:
        this.inputFormLabel = 'Amount to rebalance';
        this.feeFormLabel = 'Select rebalance fee';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      if (event.selectedIndex === 0) {
        this.inputFormGroup.controls.hiddenAmount.setValue('');
      } else if (event.selectedIndex === 1) {
        this.feeFormGroup.controls.hiddenFeeLimit.setValue('');
      }
    }    
  }

  onUseEstimate() {
    this.feeFormGroup.controls.selFeeLimitType.setValue(this.feeLimitTypes[0]);
    this.feeFormGroup.controls.feeLimit.setValue((this.queryRoute.routes && this.queryRoute.routes.length > 0 && this.queryRoute.routes[0].total_fees_msat) ? Math.ceil(+this.queryRoute.routes[0].total_fees_msat/1000) : 0);
  }

  onRebalance():boolean|void {
    if (!this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.rebalanceAmount.value <= 0 || this.inputFormGroup.controls.rebalanceAmount.value > +this.selChannel.local_balance || !this.feeFormGroup.controls.feeLimit.value || this.feeFormGroup.controls.feeLimit.value < 0 || !this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey) { return true; }
    this.feeFormGroup.controls.hiddenFeeLimit.setValue(this.feeFormGroup.controls.feeLimit.value);
    this.stepper.next();
    this.flgEditable = false;
    this.paymentRequest = '';
    this.paymentStatus = null;
    this.flgReusingInvoice = false;
    this.flgInvoiceGenerated = false;
    this.flgPaymentSent = false;
    let unsettledInvoice = this.findUnsettledInvoice();
    if (unsettledInvoice) {
      this.flgReusingInvoice = true;
      this.sendPayment(unsettledInvoice.payment_request);
    } else {
      this.store.dispatch(new LNDActions.SaveNewInvoice({
        memo: 'Local-Rebalance-' + this.inputFormGroup.controls.rebalanceAmount.value + '-Sats', invoiceValue: this.inputFormGroup.controls.rebalanceAmount.value, private: false, expiry: 3600, pageSize: PAGE_SIZE, openModal: false
      }));
    }
  }

  findUnsettledInvoice() {
    return this.invoices.invoices.find(invoice => (invoice.settle_date === '0' || invoice.settle_date === '' || !invoice.settle_date) && invoice.memo === 'Local-Rebalance-' + this.inputFormGroup.controls.rebalanceAmount.value + '-Sats' && invoice.state !== 'CANCELED');
  }

  sendPayment(payReq: string) {
    this.flgInvoiceGenerated = true;
    this.paymentRequest = payReq;
    this.store.dispatch(new LNDActions.SendPayment({paymentReq: payReq, outgoingChannel: this.selChannel, feeLimitType: this.feeFormGroup.controls.selFeeLimitType.value, feeLimit: this.feeFormGroup.controls.feeLimit.value, allowSelfPayment: true, lastHopPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey, fromDialog: true}));
  }

  filterActiveChannels() {
    this.filteredActiveChannels = this.activeChannels.filter(channel => channel.remote_balance >= this.inputFormGroup.controls.rebalanceAmount.value && channel.chan_id !== this.selChannel.chan_id);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onRestart() {
    this.flgInvoiceGenerated=false;
    this.flgPaymentSent=false;
    this.flgEditable=true;
    this.stepper.reset();
    this.inputFormGroup.reset();
    this.feeFormGroup.reset();
    this.statusFormGroup.reset();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
