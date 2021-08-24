import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { Channel } from '../../../../shared/models/clModels';
import { CLChannelInformation } from '../../../../shared/models/alertData';
import { ADDRESS_TYPES, APICallStatusEnum, TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';
import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { Store } from '@ngrx/store';
import { CLEffects } from '../../../store/cl.effects';
import * as CLActions from '../../../store/cl.actions';


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

  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType = ADDRESS_TYPES[0];
  public newAddress = '';

  public bumpFeeChannel: Channel;
  public transTypes = [...TRANS_TYPES];
  public selTransType = '2';
  public blocks = null;
  public fees = null;
  public outputIndex = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];


  constructor(private actions: Actions, public dialogRef: MatDialogRef<CLBumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: CLChannelInformation, private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private logger: LoggerService, private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.bumpFeeChannel = this.data.channel;
  }

  onBumpFee(): boolean | void {
    if (this.outputIndex  === null|| this.fees === null) {
      return true;
    }
    const utxoString = this.bumpFeeChannel.funding_txid + ':' + this.outputIndex.toString();
    this.store.dispatch(new CLActions.GetNewAddress(this.selectedAddressType));
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === CLActions.SET_NEW_ADDRESS_CL || action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL || action.type === CLActions.UPDATE_API_CALL_STATUS_CL)).
      subscribe((action: (CLActions.SetNewAddress | CLActions.SetChannelTransactionRes | CLActions.UpdateAPICallStatus)) => {
        if (action.type === CLActions.SET_NEW_ADDRESS_CL) {
          console.log(action.payload, 'all', this.fees, utxoString)
          this.store.dispatch(new CLActions.SetChannelTransaction({
            address: action.payload,
            satoshis: 'all',
            feeRate: this.fees,
            utxos: [utxoString]
          }));
        }
        if (action.type === CLActions.SET_CHANNEL_TRANSACTION_RES_CL) {
          this.dialogRef.close()
        }
        if (action.type === CLActions.UPDATE_API_CALL_STATUS_CL && action.payload.status === APICallStatusEnum.ERROR) {
          if (action.payload.action === 'SetChannelTransaction' || action.payload.action === 'GenerateNewAddress') {
            this.bumpFeeError = action.payload.message;
          }
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
