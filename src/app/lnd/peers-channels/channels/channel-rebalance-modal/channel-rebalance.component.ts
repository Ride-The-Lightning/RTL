import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ChannelRebalanceAlert } from '../../../../shared/models/alertData';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { Channel, QueryRoutes, ListInvoices } from '../../../../shared/models/lndModels';
import { FEE_LIMIT_TYPES, LNDActions, PAGE_SIZE, ScreenSizeEnum, UI_MESSAGES } from '../../../../shared/services/consts-enums-functions';

import { RTLState } from '../../../../store/rtl.state';
import { saveNewInvoice, sendPayment } from '../../../store/lnd.actions';
import { invoices } from '../../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { opacityAnimation } from '../../../../shared/animation/opacity-animation';

@Component({
  selector: 'rtl-channel-rebalance',
  templateUrl: './channel-rebalance.component.html',
  styleUrls: ['./channel-rebalance.component.scss'],
  animations: [opacityAnimation]
})
export class ChannelRebalanceComponent implements OnInit, OnDestroy {

  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faInfoCircle = faInfoCircle;
  public invoices: ListInvoices = {};
  public selChannel: Channel = {};
  public activeChannels = [];
  public filteredActiveChannels: Observable<Channel[]>;
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
  public flgShowInfo = false;
  public stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public animationDirection = 'forward';
  inputFormGroup: FormGroup;
  feeFormGroup: FormGroup;
  statusFormGroup: FormGroup;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ChannelRebalanceComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelRebalanceAlert, private logger: LoggerService, private store: Store<RTLState>, private actions: Actions, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    let x = '';
    let y = '';
    this.selChannel = this.data.message.selChannel;
    this.activeChannels = this.data.message.channels.filter((channel) => channel.active && channel.chan_id !== this.selChannel.chan_id && channel.remote_balance > 0);
    this.activeChannels = this.activeChannels.sort((c1: Channel, c2: Channel) => {
      x = c1.remote_alias ? c1.remote_alias.toLowerCase() : c1.chan_id ? c1.chan_id.toLowerCase() : '';
      y = c2.remote_alias ? c2.remote_alias.toLowerCase() : c1.chan_id.toLowerCase();
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    FEE_LIMIT_TYPES.forEach((FEE_LIMIT_TYPE, i) => {
      if (i > 0) {
        this.feeLimitTypes.push(FEE_LIMIT_TYPE);
      }
    });
    // HiddenAmount & hiddenFeeLimit are temporary hacks to overcome material steppers stepChanged event shortcoming.
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
    this.store.select(invoices).pipe(takeUntil(this.unSubs[0])).
      subscribe((invoicesSelector: { listInvoices: ListInvoices, apiCallStatus: ApiCallStatusPayload }) => {
        this.invoices = invoicesSelector.listInvoices;
        this.logger.info(invoicesSelector);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === LNDActions.SET_QUERY_ROUTES_LND || action.type === LNDActions.SEND_PAYMENT_STATUS_LND || action.type === LNDActions.NEWLY_SAVED_INVOICE_LND)).
      subscribe((action: any) => {
        if (action.type === LNDActions.SET_QUERY_ROUTES_LND) {
          this.queryRoute = action.payload;
        }
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
    this.inputFormGroup.get('rebalanceAmount').valueChanges.pipe(
      takeUntil(this.unSubs[2]), startWith(0)).
      subscribe((amount) => {
        this.inputFormGroup.controls.selRebalancePeer.setValue('');
        this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
        this.filteredActiveChannels = of(amount ? this.filterActiveChannels() : this.activeChannels.slice());
      });
    this.inputFormGroup.get('selRebalancePeer').valueChanges.pipe(
      takeUntil(this.unSubs[3]), startWith('')).
      subscribe((alias) => {
        if (typeof alias === 'string') {
          this.filteredActiveChannels = of(this.filterActiveChannels());
        }
      });
  }

  onSelectFee(): boolean | void {
    if (this.inputFormGroup.controls.selRebalancePeer.value && typeof this.inputFormGroup.controls.selRebalancePeer.value === 'string') {
      this.onSelectedPeerChanged();
    }
    if (!this.inputFormGroup.controls.selRebalancePeer.value || typeof this.inputFormGroup.controls.selRebalancePeer.value === 'string') {
      this.inputFormGroup.controls.selRebalancePeer.setErrors({ required: true });
      return true;
    }
    if (!this.inputFormGroup.controls.rebalanceAmount.value) {
      return true;
    }
    if (this.stepper.selectedIndex === 0) {
      this.inputFormGroup.controls.hiddenAmount.setValue(this.inputFormGroup.controls.rebalanceAmount.value);
      this.stepper.next();
    }
    this.queryRoute = null;
    this.feeFormGroup.reset();
    this.feeFormGroup.controls.selFeeLimitType.setValue(this.feeLimitTypes[0]);
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to rebalance';
        this.feeFormLabel = 'Select rebalance fee';
        break;

      case 1:
        if (this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.selRebalancePeer.value.remote_alias) {
          this.inputFormLabel = 'Rebalancing Amount: ' +
            (this.decimalPipe.transform(this.inputFormGroup.controls.rebalanceAmount.value ? this.inputFormGroup.controls.rebalanceAmount.value : 0)) + ' Sats | Peer: ' + (this.inputFormGroup.controls.selRebalancePeer.value.remote_alias ? this.inputFormGroup.controls.selRebalancePeer.value.remote_alias : (this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey.substring(0, 15) + '...'));
        } else {
          this.inputFormLabel = 'Amount to rebalance';
        }
        this.feeFormLabel = 'Select rebalance fee';
        break;

      case 2:
        if (this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.selRebalancePeer.value.remote_alias) {
          this.inputFormLabel = 'Rebalancing Amount: ' +
            (this.decimalPipe.transform(this.inputFormGroup.controls.rebalanceAmount.value ? this.inputFormGroup.controls.rebalanceAmount.value : 0)) + ' Sats | Peer: ' + (this.inputFormGroup.controls.selRebalancePeer.value.remote_alias ? this.inputFormGroup.controls.selRebalancePeer.value.remote_alias : (this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey.substring(0, 15) + '...'));
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

  onRebalance(): boolean | void {
    if (!this.inputFormGroup.controls.rebalanceAmount.value || this.inputFormGroup.controls.rebalanceAmount.value <= 0 || this.inputFormGroup.controls.rebalanceAmount.value > +this.selChannel.local_balance || !this.feeFormGroup.controls.feeLimit.value || this.feeFormGroup.controls.feeLimit.value < 0 || !this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey) {
      return true;
    }
    this.feeFormGroup.controls.hiddenFeeLimit.setValue(this.feeFormGroup.controls.feeLimit.value);
    this.stepper.next();
    this.flgEditable = false;
    this.paymentRequest = '';
    this.paymentStatus = null;
    this.flgReusingInvoice = false;
    this.flgInvoiceGenerated = false;
    this.flgPaymentSent = false;
    const unsettledInvoice = this.findUnsettledInvoice();
    if (unsettledInvoice) {
      this.flgReusingInvoice = true;
      this.sendPayment(unsettledInvoice.payment_request);
    } else {
      this.store.dispatch(saveNewInvoice({
        payload: {
          uiMessage: UI_MESSAGES.NO_SPINNER, memo: 'Local-Rebalance-' + this.inputFormGroup.controls.rebalanceAmount.value + '-Sats', invoiceValue: this.inputFormGroup.controls.rebalanceAmount.value, private: false, expiry: 3600, pageSize: PAGE_SIZE, openModal: false
        }
      }));
    }
  }

  findUnsettledInvoice() {
    return this.invoices.invoices.find((invoice) => (+invoice.settle_date === 0 || !invoice.settle_date) && invoice.memo === 'Local-Rebalance-' + this.inputFormGroup.controls.rebalanceAmount.value + '-Sats' && invoice.state !== 'CANCELED');
  }

  sendPayment(payReq: string) {
    this.flgInvoiceGenerated = true;
    this.paymentRequest = payReq;
    if (this.feeFormGroup.controls.selFeeLimitType.value.id === 'percent' && !(+this.feeFormGroup.controls.feeLimit.value % 1 === 0)) {
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, paymentReq: payReq, outgoingChannel: this.selChannel, feeLimitType: 'fixed', feeLimit: Math.ceil((+this.feeFormGroup.controls.feeLimit.value * +this.inputFormGroup.controls.rebalanceAmount.value) / 100), allowSelfPayment: true, lastHopPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey, fromDialog: true } }));
    } else {
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, paymentReq: payReq, outgoingChannel: this.selChannel, feeLimitType: this.feeFormGroup.controls.selFeeLimitType.value.id, feeLimit: this.feeFormGroup.controls.feeLimit.value, allowSelfPayment: true, lastHopPubkey: this.inputFormGroup.controls.selRebalancePeer.value.remote_pubkey, fromDialog: true } }));
    }
  }

  filterActiveChannels() {
    return this.activeChannels.filter((channel) => channel.remote_balance >= this.inputFormGroup.controls.rebalanceAmount.value &&
      channel.chan_id !== this.selChannel.chan_id && ((channel.remote_alias.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0) || (channel.chan_id.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0)));
  }

  onSelectedPeerChanged() {
    if (this.inputFormGroup.controls.selRebalancePeer.value && this.inputFormGroup.controls.selRebalancePeer.value.length > 0 && typeof this.inputFormGroup.controls.selRebalancePeer.value === 'string') {
      const foundChannels = this.activeChannels.filter((channel) => channel.remote_alias.length === this.inputFormGroup.controls.selRebalancePeer.value.length && channel.remote_alias.toLowerCase().indexOf(this.inputFormGroup.controls.selRebalancePeer.value ? this.inputFormGroup.controls.selRebalancePeer.value.toLowerCase() : '') === 0);
      if (foundChannels && foundChannels.length > 0) {
        this.inputFormGroup.controls.selRebalancePeer.setValue(foundChannels[0]);
        this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
      } else {
        this.inputFormGroup.controls.selRebalancePeer.setErrors({ notfound: true });
      }
    }
  }

  displayFn(channel: Channel): string {
    return (channel && channel.remote_alias) ? channel.remote_alias : (channel && channel.chan_id) ? channel.chan_id : '';
  }

  showInfo() {
    this.flgShowInfo = true;
  }

  onStepChanged(index: number) {
    this.animationDirection = index < this.stepNumber ? 'backward' : 'forward';
    this.stepNumber = index;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onRestart() {
    this.flgInvoiceGenerated = false;
    this.flgPaymentSent = false;
    this.flgEditable = true;
    this.stepper.reset();
    this.inputFormGroup.reset();
    this.feeFormGroup.reset();
    this.statusFormGroup.reset();
    this.inputFormGroup.controls.hiddenAmount.setValue('');
    this.inputFormGroup.controls.hiddenAmount.setErrors(null);
    this.inputFormGroup.controls.rebalanceAmount.setValue('');
    this.inputFormGroup.controls.rebalanceAmount.setErrors(null);
    this.inputFormGroup.controls.selRebalancePeer.setValue('');
    this.inputFormGroup.controls.selRebalancePeer.setErrors(null);
    this.filteredActiveChannels = of(this.activeChannels);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
