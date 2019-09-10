import { Component, OnInit, Input } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ChannelEdgeCL } from '../../../shared/models/clModels';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channel-lookup',
  templateUrl: './channel-lookup.component.html',
  styleUrls: ['./channel-lookup.component.css']
})
export class CLChannelLookupComponent implements OnInit {
  @Input() lookupResult: ChannelEdgeCL[];
  public node1_match = false;
  public node2_match = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    if (this.lookupResult.length > 0 && undefined !== this.lookupResult[0].last_update_str) {
      this.lookupResult[0].last_update_str = (this.lookupResult[0].last_update_str === '') ?
        '' : formatDate(this.lookupResult[0].last_update_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
    }
    if (this.lookupResult.length > 1 && undefined !== this.lookupResult[1].last_update_str) {
      this.lookupResult[1].last_update_str = (this.lookupResult[1].last_update_str === '') ?
        '' : formatDate(this.lookupResult[1].last_update_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
    }
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
