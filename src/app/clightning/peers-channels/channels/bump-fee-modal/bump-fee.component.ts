import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { Channel } from '../../../../shared/models/clModels';
import { CLChannelInformation } from '../../../../shared/models/alertData';
import { ADDRESS_TYPES, TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';
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


  constructor(public dialogRef: MatDialogRef<CLBumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: CLChannelInformation, private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private logger: LoggerService, private dataService: DataService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.bumpFeeChannel = this.data.channel;
  }

  onBumpFee(): boolean|void {
    if (!this.outputIndex || !this.fees) {
      console.warn(typeof this.outputIndex.toString(), '---', typeof this.fees);
      return true;
    }
    const utxoString = this.bumpFeeChannel.funding_txid + ':' + this.outputIndex.toString();
    this.store.dispatch(new CLActions.GetNewAddress(this.selectedAddressType));
    this.clEffects.setNewAddressCL.
      pipe(take(1)).
      subscribe({ next : (newAddress) => {
        this.newAddress = newAddress;
        console.warn(this.newAddress, ', all ,', this.fees, 0, [utxoString], '\n');
        this.store.dispatch(new CLActions.SetChannelTransaction({
          address:this.newAddress,
          satoshis:'all',
          feeRate:this.fees,
          utxos:[utxoString]
        }));
        this.clEffects.SetChannelTransactionCL.
          pipe(take(1)).
          subscribe({ next:(data) => {
            this.dialogRef.close(false);
          }, error:(err) => {
            this.logger.error(err);
          } });
      }, error: (err) => {
        this.bumpFeeError = err.message ? err.message : err;
        this.logger.error(err);
      } });
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
