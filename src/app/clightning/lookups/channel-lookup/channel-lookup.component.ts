import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ChannelEdge } from '../../../shared/models/clModels';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channel-lookup',
  templateUrl: './channel-lookup.component.html',
  styleUrls: ['./channel-lookup.component.scss']
})
export class CLChannelLookupComponent implements OnInit {
  @Input() lookupResult: ChannelEdge[];
  public node1_match = false;
  public node2_match = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if (this.lookupResult.length > 0 && this.lookupResult[0].source === rtlStore.information.id) {
        this.node1_match = true;
      }
      if (this.lookupResult.length > 1 && this.lookupResult[1].source === rtlStore.information.id) {
        this.node2_match = true;
      }
    });
  }

}
