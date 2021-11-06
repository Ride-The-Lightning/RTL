import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../../shared/services/logger.service';

import * as LNDActions from '../../store/lnd.actions';
import { RTLState } from '../../../store/rtl.state';

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
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.dispatch(new LNDActions.FetchTransactions());
    this.store.dispatch(new LNDActions.FetchUTXOs());
    this.store.select('lnd').
      pipe(takeUntil(this.unSubs[0])).
      subscribe((rtlStore) => {
        if (rtlStore.utxos && rtlStore.utxos.length > 0) {
          this.numUtxos = rtlStore.utxos.length;
          this.numDustUtxos = rtlStore.utxos.filter((utxo) => +utxo.amount_sat < 1000).length;
        }
        if (rtlStore.transactions && rtlStore.transactions.length > 0) {
          this.numTransactions = rtlStore.transactions.length;
        }
        this.logger.info(rtlStore);
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
