import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Transaction, UTXO } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import * as LNDActions from '../../store/lnd.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-utxo-tables',
  templateUrl: './utxo-tables.component.html',
  styleUrls: ['./utxo-tables.component.scss']
})
export class UTXOTablesComponent implements OnInit, OnDestroy {
  @Input() selectedTableIndex = 0;
  @Output() selectedTableIndexChange = new EventEmitter<number>();
  public transactions: Transaction[] = [];
  public numTransactions = 0;
  public utxos: UTXO[] = [];
  public numUtxos = 0;
  public dustUtxos: UTXO[] = [];
  public numDustUtxos = 0;
  public flgLoading: Array<Boolean | 'error'> = [true, true];
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.dispatch(new LNDActions.FetchTransactions());
    this.store.dispatch(new LNDActions.FetchUTXOs());
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchUTXOs') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchTransactions') {
          this.flgLoading[1] = 'error';
        }
      });
      if (rtlStore.utxos && rtlStore.utxos.length > 0) {
        this.utxos = rtlStore.utxos;
        this.numUtxos = this.utxos.length;
        this.dustUtxos = rtlStore.utxos.filter(utxo => +utxo.amount_sat < 1000);
        this.numDustUtxos = this.dustUtxos.length;
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.utxos) ? false : true;
      }
      if (rtlStore.transactions && rtlStore.transactions.length > 0) {
        this.transactions = rtlStore.transactions;
        this.numTransactions = this.transactions.length;
      }
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (rtlStore.transactions) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  onSelectedIndexChanged(event) {
    this.selectedTableIndexChange.emit(event);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
