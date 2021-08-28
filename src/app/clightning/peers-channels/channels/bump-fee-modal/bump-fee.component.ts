import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Channel } from '../../../../shared/models/clModels';
import { CLChannelInformation } from '../../../../shared/models/alertData';
import { ADDRESS_TYPES, APICallStatusEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';

import * as CLActions from '../../../store/cl.actions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-bump-fee',
  templateUrl: './bump-fee.component.html',
  styleUrls: ['./bump-fee.component.scss']
})
export class CLBumpFeeComponent implements OnInit, OnDestroy {

  private outputIdx: NgModel;
  @ViewChild('outputIdx') set payReq(outIdx: NgModel) {
    if (outIdx) {
      this.outputIdx = outIdx;
    }
  }

  public newAddress = '';
  public bumpFeeChannel: Channel;
  public fees = null;
  public outputIndex = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private actions: Actions, public dialogRef: MatDialogRef<CLBumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: CLChannelInformation, private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.bumpFeeChannel = this.data.channel;
  }

  onBumpFee(): boolean | void {
    if ((!this.outputIndex && this.outputIndex !== 0) || !this.fees) {
      return true;
    }
    this.bumpFeeError = '';
    this.store.dispatch(new CLActions.GetNewAddress(ADDRESS_TYPES[0]));
    this.actions.pipe(filter((action) => action.type === CLActions.SET_NEW_ADDRESS_CL), take(1)).
      subscribe((action: CLActions.SetNewAddress) => {
        this.store.dispatch(new CLActions.SetChannelTransaction({
          address: action.payload,
          satoshis: 'all',
          feeRate: this.fees,
          utxos: [this.bumpFeeChannel.funding_txid + ':' + this.outputIndex.toString()]
        }));
      });
    this.actions.pipe(filter((action) => action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL), take(1)).
      subscribe((action: CLActions.SetChannelTransactionRes) => {
        this.store.dispatch(new RTLActions.OpenSnackBar('Successfully bumped the fee. Use the block explorer to verify transaction.'));
        this.dialogRef.close();
      });
    this.actions.pipe(filter((action) => action.type === CLActions.UPDATE_API_CALL_STATUS_CL), takeUntil(this.unSubs[0])).
      subscribe((action: CLActions.UpdateAPICallStatus) => {
        if (action.payload.status === APICallStatusEnum.ERROR && (action.payload.action === 'SetChannelTransaction' || action.payload.action === 'GenerateNewAddress')) {
          this.logger.error(action.payload.message);
          this.bumpFeeError = action.payload.message;
        }
      });
  }

  onCopyID(payload: string) {
    this.snackBar.open('Transaction ID copied.');
  }

  resetData() {
    this.bumpFeeError = '';
    this.fees = null;
    this.outputIndex = null;
    this.outputIdx.control.setErrors(null);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
