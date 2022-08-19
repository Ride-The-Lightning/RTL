import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { UTXO } from '../../../shared/models/clnModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { utxos } from '../../store/cln.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-cln-utxo-tables',
  templateUrl: './utxo-tables.component.html',
  styleUrls: ['./utxo-tables.component.scss']
})
export class CLNUTXOTablesComponent implements OnInit, OnDestroy {

  @Input() selectedTableIndex = 0;
  @Output() readonly selectedTableIndexChange = new EventEmitter<number>();
  public utxos: UTXO[] = [];
  public numUtxos = 0;
  public dustUtxos: UTXO[] = [];
  public numDustUtxos = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(utxos).pipe(takeUntil(this.unSubs[0])).
      subscribe((utxosSeletor: { utxos: UTXO[], apiCallStatus: ApiCallStatusPayload }) => {
        if (utxosSeletor.utxos && utxosSeletor.utxos.length > 0) {
          this.utxos = utxosSeletor.utxos;
          this.numUtxos = this.utxos.length;
          this.dustUtxos = utxosSeletor.utxos?.filter((utxo) => +(utxo.value || 0) < 1000);
          this.numDustUtxos = this.dustUtxos.length;
        }
        if (utxosSeletor.utxos && utxosSeletor.utxos.length > 0) {
          this.utxos = utxosSeletor.utxos;
          this.numUtxos = this.utxos.length;
        }
        this.logger.info(utxosSeletor);
      });
  }

  onSelectedIndexChanged(event) {
    this.selectedTableIndexChange.emit(event);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
