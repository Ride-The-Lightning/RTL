import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Channel } from '../../../../shared/models/clnModels';
import { CLNChannelInformation } from '../../../../shared/models/alertData';
import { ADDRESS_TYPES, APICallStatusEnum, CLNActions } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';

import { RTLState } from '../../../../store/rtl.state';
import { openSnackBar } from '../../../../store/rtl.actions';
import { getNewAddress, setChannelTransaction } from '../../../store/cln.actions';

@Component({
  selector: 'rtl-cln-bump-fee',
  templateUrl: './bump-fee.component.html',
  styleUrls: ['./bump-fee.component.scss']
})
export class CLNBumpFeeComponent implements OnInit, OnDestroy {

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

  constructor(private actions: Actions, public dialogRef: MatDialogRef<CLNBumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNChannelInformation, private store: Store<RTLState>, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.bumpFeeChannel = this.data.channel;
  }

  onBumpFee(): boolean | void {
    if ((!this.outputIndex && this.outputIndex !== 0) || !this.fees) {
      return true;
    }
    this.bumpFeeError = '';
    this.store.dispatch(getNewAddress({ payload: ADDRESS_TYPES[0] }));
    this.actions.pipe(filter((action) => action.type === CLNActions.SET_NEW_ADDRESS_CLN), take(1)).
      subscribe((action: any) => {
        this.store.dispatch(setChannelTransaction({
          payload: {
            address: action.payload,
            satoshis: 'all',
            feeRate: this.fees,
            utxos: [this.bumpFeeChannel.funding_txid + ':' + this.outputIndex.toString()]
          }
        }));
      });
    this.actions.pipe(filter((action) => action.type === CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN), take(1)).
      subscribe((action: any) => {
        this.store.dispatch(openSnackBar({ payload: 'Successfully bumped the fee. Use the block explorer to verify transaction.' }));
        this.dialogRef.close();
      });
    this.actions.pipe(filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN), takeUntil(this.unSubs[0])).
      subscribe((action: any) => {
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
