import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Transaction, UTXO } from '../../../shared/models/lndModels';
import { OnChainLabelUTXO } from '../../../shared/models/alertData';
import { DataService } from '../../../shared/services/data.service';
import { getLNDTxidBytes } from '../../../shared/services/consts-enums-functions';

import { RTLState } from '../../../store/rtl.state';
import { CommonService } from '../../../shared/services/common.service';
import { fetchTransactions, fetchUTXOs } from '../../store/lnd.actions';

@Component({
  standalone: false,
  selector: 'rtl-on-chain-lebel-modal',
  templateUrl: './on-chain-label-modal.component.html',
  styleUrls: ['./on-chain-label-modal.component.scss']
})
export class OnChainLabelModalComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public faExclamationTriangle = faExclamationTriangle;
  public utxo: UTXO | null = null;
  public transaction: Transaction | null = null;
  public label = '';
  public labelError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OnChainLabelModalComponent>, @Inject(MAT_DIALOG_DATA) public data: OnChainLabelUTXO, private dataService: DataService, private store: Store<RTLState>, private snackBar: MatSnackBar, private commonService: CommonService) { }

  ngOnInit() {
    this.utxo = this.data.utxo || null;
    this.transaction = this.data.transaction || null;
    this.label = (this.transaction ? this.transaction.label : this.utxo?.label) || '';
  }

  onLabelUTXO(): boolean | void {
    if (!this.label || this.label === '') {
      return true;
    }
    this.labelError = '';
    const txidBytes = this.transaction ? getLNDTxidBytes(this.transaction.tx_hash) : (this.utxo && this.utxo.outpoint && this.utxo.outpoint.txid_bytes ? this.utxo.outpoint.txid_bytes : '');
    this.dataService.labelUTXO(txidBytes, this.label, true).
      pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (res) => {
          this.store.dispatch(fetchTransactions());
          this.store.dispatch(fetchUTXOs());
          this.snackBar.open(this.transaction ? 'Successfully labelled the transaction.' : 'Successfully labelled the UTXO.');
          this.dialogRef.close();
        }, error: (err) => {
          this.labelError = err;
        }
      });
  }

  resetData() {
    this.labelError = '';
    this.label = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
