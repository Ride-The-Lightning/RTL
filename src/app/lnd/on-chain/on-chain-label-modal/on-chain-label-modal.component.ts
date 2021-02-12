import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UTXO } from '../../../shared/models/lndModels';
import { OnChainLabelUTXO } from '../../../shared/models/alertData';
import { DataService } from '../../../shared/services/data.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as LNDActions from '../../../lnd/store/lnd.actions';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'rtl-on-chain-lebel-modal',
  templateUrl: './on-chain-label-modal.component.html',
  styleUrls: ['./on-chain-label-modal.component.scss']
})
export class OnChainLabelModalComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;  
  public faExclamationTriangle = faExclamationTriangle;
  public utxo: UTXO = null;
  public label = '';
  public labelError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OnChainLabelModalComponent>, @Inject(MAT_DIALOG_DATA) public data: OnChainLabelUTXO, private dataService: DataService, private store: Store<fromRTLReducer.RTLState>, private snackBar: MatSnackBar, private commonService: CommonService) {}

  ngOnInit() {
    this.utxo = this.data.utxo;
    this.label = this.utxo.label;
  }

  onLabelUTXO(): boolean|void {
    if(!this.label || this.label === '') { return true; }
    this.labelError = '';
    this.store.dispatch(new RTLActions.OpenSpinner('Labelling UTXO...'));
    this.dataService.labelUTXO(this.utxo.outpoint.txid_bytes, this.label, true)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(res => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new LNDActions.FetchTransactions());
      this.store.dispatch(new LNDActions.FetchUTXOs());
      this.snackBar.open('Successfully labelled the UTXO.');
      this.dialogRef.close();
    }, (err) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.labelError = err.error && err.error.error && err.error.error.error ? err.error.error.error : err.error && err.error.error ? err.error.error : err.error ? err.error : err;
      this.labelError = (typeof this.labelError === 'string') ? this.commonService.titleCase(this.labelError) : JSON.stringify(this.labelError);
    });
  }

  resetData() {
    this.labelError = '';    
    this.label = '';      
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
