import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ChannelEdge, GetInfo } from '../../../shared/models/lndModels';
import { RTLState } from '../../../store/rtl.state';
import { lndNodeInformation } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-channel-lookup',
  templateUrl: './channel-lookup.component.html',
  styleUrls: ['./channel-lookup.component.scss']
})
export class ChannelLookupComponent implements OnInit {

  @Input() lookupResult: ChannelEdge;
  public node1_match = false;
  public node2_match = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>) { }

  ngOnInit() {
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).subscribe((nodeInfo: GetInfo) => {
      if (this.lookupResult.node1_pub === nodeInfo.identity_pubkey) {
        this.node1_match = true;
      }
      if (this.lookupResult.node2_pub === nodeInfo.identity_pubkey) {
        this.node2_match = true;
      }
    });
  }

}
