import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { UTXO } from '../../../shared/models/clModels';
import { LoggerService } from '../../../shared/services/logger.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-utxo-tables',
  templateUrl: './utxo-tables.component.html',
  styleUrls: ['./utxo-tables.component.scss']
})
export class CLUTXOTablesComponent implements OnInit, OnDestroy {
  @Input() selectedTableIndex = 0;
  @Output() selectedTableIndexChange = new EventEmitter<number>();
  public utxos: UTXO[] = [];
  public numUtxos = 0;
  public dustUtxos: UTXO[] = [];
  public numDustUtxos = 0;
  public flgLoading: Array<Boolean | 'error'> = [true, true];
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchUTXOs') {
          this.flgLoading[1] = 'error';
        }
      });
      if (rtlStore.utxos && rtlStore.utxos.length > 0) {
        this.utxos = rtlStore.utxos;
        this.numUtxos = this.utxos.length;
        this.dustUtxos = rtlStore.utxos.filter(utxo => +utxo.value < 1000);
        this.numDustUtxos = this.dustUtxos.length;
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (rtlStore.utxos) ? false : true;
      }
      if (rtlStore.utxos && rtlStore.utxos.length > 0) {
        this.utxos = rtlStore.utxos;
        this.numUtxos = this.utxos.length;
      }
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (rtlStore.utxos) ? false : true;
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
