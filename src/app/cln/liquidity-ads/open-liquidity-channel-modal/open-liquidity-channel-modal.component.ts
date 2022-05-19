import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LookupNode } from '../../../shared/models/clnModels';
import { CLNOpenLiquidityChannelAlert } from '../../../shared/models/alertData';
import { APICallStatusEnum, CLNActions } from '../../../shared/services/consts-enums-functions';

import { RTLState } from '../../../store/rtl.state';
import { saveNewChannel } from '../../store/cln.actions';

@Component({
  selector: 'rtl-cln-open-liquidity-channel',
  templateUrl: './open-liquidity-channel-modal.component.html',
  styleUrls: ['./open-liquidity-channel-modal.component.scss']
})
export class CLNOpenLiquidityChannelComponent implements OnInit, OnDestroy {

  public faExclamationTriangle = faExclamationTriangle;
  @ViewChild('form', { static: true }) form: any;
  public alertTitle: string;
  public totalBalance = 0;
  public node: LookupNode;
  public requestedAmount = 0;
  public feeRate = 0;
  public localAmount = 0;
  public channelConnectionError = '';
  public displayedColumns = ['type', 'address', 'port'];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNOpenLiquidityChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOpenLiquidityChannelAlert, private actions: Actions, private store: Store<RTLState>) { }

  ngOnInit() {
    this.alertTitle = this.data.alertTitle;
    this.totalBalance = this.data.message.balance;
    this.node = this.data.message.node;
    this.requestedAmount = this.data.message.requestedAmount;
    this.feeRate = this.data.message.feeRate;
    this.localAmount = this.data.message.localAmount;
    this.actions.pipe(
      takeUntil(this.unSubs[0]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN || action.type === CLNActions.FETCH_CHANNELS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
        if (action.type === CLNActions.FETCH_CHANNELS_CLN) {
          this.dialogRef.close();
        }
      });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.form.resetForm();
    this.form.controls.ramount.setValue(this.data.message.requestedAmount);
    this.form.controls.feerate.setValue(this.data.message.feeRate);
    this.form.controls.lamount.setValue(this.data.message.localAmount);
    this.calculateFee();
    this.channelConnectionError = '';
  }

  calculateFee() {
    this.node.channelOpeningFee = (+(this.node.option_will_fund.lease_fee_base_msat) / 1000) + (this.requestedAmount * (+this.node.option_will_fund.lease_fee_basis) / 10000) + ((+this.node.option_will_fund.funding_weight / 4) * this.feeRate);
  }

  onOpenChannel(): boolean | void {
    if (!this.node || !this.node.option_will_fund || !this.requestedAmount || !this.feeRate || !this.localAmount) {
      return true;
    }
    const newChannel = { peerId: this.node.nodeid, satoshis: this.localAmount.toString(), feeRate: this.feeRate + 'perkb', requestAmount: this.requestedAmount.toString(), compactLease: this.node.option_will_fund.compact_lease };
    this.store.dispatch(saveNewChannel({ payload: newChannel }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
