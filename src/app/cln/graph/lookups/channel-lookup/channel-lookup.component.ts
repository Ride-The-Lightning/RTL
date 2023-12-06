import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { GetInfo, ChannelEdge } from '../../../../shared/models/clnModels';
import { RTLState } from '../../../../store/rtl.state';
import { clnNodeInformation } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-channel-lookup',
  templateUrl: './channel-lookup.component.html',
  styleUrls: ['./channel-lookup.component.scss']
})
export class CLNChannelLookupComponent implements OnInit {

  @Input() lookupResult: ChannelEdge = {};
  public node1_match = false;
  public node2_match = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: GetInfo) => {
        if (this.lookupResult.channels && this.lookupResult.channels.length > 0 && this.lookupResult.channels[0].source === nodeInfo.id) {
          this.node1_match = true;
        }
        if (this.lookupResult.channels && this.lookupResult.channels.length > 1 && this.lookupResult.channels[1].source === nodeInfo.id) {
          this.node2_match = true;
        }
      });
  }

}
