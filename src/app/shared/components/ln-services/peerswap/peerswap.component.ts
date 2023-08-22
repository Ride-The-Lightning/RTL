import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faHandshake } from '@fortawesome/free-solid-svg-icons';
import { RTLState } from 'src/app/store/rtl.state';
import { PeerswapPolicy } from 'src/app/shared/models/peerswapModels';
import { ApiCallStatusPayload } from 'src/app/shared/models/apiCallsPayload';
import { psPolicy } from 'src/app/cln/store/cln.selector';
import { APICallStatusEnum } from 'src/app/shared/services/consts-enums-functions';
import { fetchPSPolicy } from 'src/app/cln/store/cln.actions';

@Component({
  selector: 'rtl-peerswap',
  templateUrl: './peerswap.component.html',
  styleUrls: ['./peerswap.component.scss']
})
export class PeerswapComponent implements OnInit, OnDestroy {

  public faHandshake = faHandshake;
  public links = [{ link: 'pspeers', name: 'Peers' }, { link: 'psout', name: 'Swap Out' }, { link: 'psin', name: 'Swap In' }, { link: 'pscanceled', name: 'Swap Canceled' }];
  public activeTab = this.links[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router, private store: Store<RTLState>) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeTab = linkFound ? linkFound : this.links[0];
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          this.activeTab = linkFound ? linkFound : this.links[0];
        }
      });
    this.store.select(psPolicy).pipe(takeUntil(this.unSubs[1])).subscribe((policySeletor: { policy: PeerswapPolicy, apiCallStatus: ApiCallStatusPayload }) => {
      if (policySeletor.apiCallStatus.status === APICallStatusEnum.UN_INITIATED) {
        this.store.dispatch(fetchPSPolicy());
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
