import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { fetchTransactions, fetchUTXOs } from '../../store/lnd.actions';
import { transactions, utxos } from '../../store/lnd.selector';
import { Transaction, UTXO } from '../../../shared/models/lndModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-utxo-tables',
  templateUrl: './utxo-tables.component.html',
  styleUrls: ['./utxo-tables.component.scss']
})
export class UTXOTablesComponent implements OnInit, OnDestroy {

  @Input() selectedTableIndex = 0;
  @Output() readonly selectedTableIndexChange = new EventEmitter<number>();
  public numTransactions = 0;
  public numUtxos = 0;
  public numDustUtxos = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.dispatch(fetchTransactions());
    this.store.dispatch(fetchUTXOs());
    this.store.select(utxos).pipe(takeUntil(this.unSubs[0])).
      subscribe((utxosSelector: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        if (utxosSelector.utxos && utxosSelector.utxos.length > 0) {
          this.numUtxos = utxosSelector.utxos.length;
          this.numDustUtxos = utxosSelector.utxos.filter((utxo) => +utxo.amount_sat < 1000).length;
        }
        this.logger.info(utxosSelector);
      });
    this.store.select(transactions).pipe(takeUntil(this.unSubs[1])).
      subscribe((transactionsSelector: { transactions: Transaction[], apiCallStatus: ApiCallStatusPayload }) => {
        if (transactionsSelector.transactions && transactionsSelector.transactions.length > 0) {
          this.numTransactions = transactionsSelector.transactions.length;
        }
        this.logger.info(transactionsSelector);
      });
  }

  onSelectedIndexChanged(event) {
    this.selectedTableIndexChange.emit(event);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
