import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';

import { RTLState } from 'src/app/store/rtl.state';
import { LoggerService } from '../../../../shared/services/logger.service';
import { PeerswapPolicy, Swap, SwapPeerChannelsFlattened } from 'src/app/shared/models/peerswapModels';
import { ApiCallStatusPayload } from 'src/app/shared/models/apiCallsPayload';
import { psPolicy, swapPeers, swaps } from 'src/app/cln/store/cln.selector';
import { APICallStatusEnum } from 'src/app/shared/services/consts-enums-functions';
import { fetchPSPolicy, fetchSwaps } from 'src/app/cln/store/cln.actions';

@Component({
  selector: 'rtl-peerswap',
  templateUrl: './peerswap.component.html',
  styleUrls: ['./peerswap.component.scss']
})
export class PeerswapComponent implements OnInit, OnDestroy {

  public faHandshake = faHandshake;
  public links = [{ link: 'pspeers', name: 'Peers', num_records: 0 }, { link: 'psout', name: 'Swap Out', num_records: 0 }, { link: 'psin', name: 'Swap In', num_records: 0 }, { link: 'pscanceled', name: 'Swap Canceled', num_records: 0 }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private router: Router, private store: Store<RTLState>) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          this.activeLink = this.links.findIndex((link) => link.link === (<ResolveEnd>value).urlAfterRedirects.substring((<ResolveEnd>value).urlAfterRedirects.lastIndexOf('/') + 1));
        }
      });
    this.store.select(swaps).pipe(takeUntil(this.unSubs[2])).
      subscribe((swapsSeletor: { swapOuts: Swap[], swapIns: Swap[], swapsCanceled: Swap[], apiCallStatus: ApiCallStatusPayload }) => {
        if (swapsSeletor.apiCallStatus?.status === APICallStatusEnum.UN_INITIATED) {
          this.store.dispatch(fetchSwaps());
        }
        if (swapsSeletor.apiCallStatus?.status === APICallStatusEnum.COMPLETED) {
          this.links[1].num_records = swapsSeletor.swapOuts.length || 0;
          this.links[2].num_records = swapsSeletor.swapIns.length || 0;
          this.links[3].num_records = swapsSeletor.swapsCanceled.length || 0;
        }
        this.logger.info(swapsSeletor);
      });
    this.store.select(swapPeers).pipe(takeUntil(this.unSubs[3])).
      subscribe((spSeletor: { totalSwapPeers: number, swapPeers: SwapPeerChannelsFlattened[], apiCallStatus: ApiCallStatusPayload }) => {
        this.links[0].num_records = spSeletor.totalSwapPeers;
        this.logger.info(spSeletor);
      });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/services/peerswap/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
