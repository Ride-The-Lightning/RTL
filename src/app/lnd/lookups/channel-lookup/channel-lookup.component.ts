import { Component, OnInit, Input } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ChannelEdge } from '../../../shared/models/lndModels';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-lookup',
  templateUrl: './channel-lookup.component.html',
  styleUrls: ['./channel-lookup.component.css']
})
export class ChannelLookupComponent implements OnInit {
  @Input() lookupResult: ChannelEdge;
  public node1_match = false;
  public node2_match = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    if (undefined !== this.lookupResult && undefined !== this.lookupResult.last_update_str) {
      this.lookupResult.last_update_str = (this.lookupResult.last_update_str === '') ?
        '' : formatDate(this.lookupResult.last_update_str, 'MMM/dd/yy HH:mm:ss', 'en-US');
    }
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if (this.lookupResult.node1_pub === rtlStore.information.identity_pubkey) {
        this.node1_match = true;
      }
      if (this.lookupResult.node2_pub === rtlStore.information.identity_pubkey) {
        this.node2_match = true;
      }
    });
  }

}
