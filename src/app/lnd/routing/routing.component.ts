import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import * as LNDActions from '../store/lnd.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public today = new Date(Date.now());
  public lastMonthDay = new Date(this.today.getFullYear(), this.today.getMonth() - 1, this.today.getDate() + 1, 0, 0, 0);
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, 0, 0, 0);
  public endDate = this.today;
  public startDate = this.lastMonthDay;
  public links = [{link: 'forwardinghistory', name: 'Forwarding History'}, {link: 'peers', name: 'Routing Peers'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    this.onEventsFetch();
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    });
  }

  onEventsFetch() {
    this.store.dispatch(new LNDActions.SetForwardingHistory({}));
    if (!this.endDate) {
      this.endDate = this.today;
    }
    if (!this.startDate) {
      this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth() - 1, this.endDate.getDate() + 1, 0, 0, 0);
    }
    this.store.dispatch(new LNDActions.GetForwardingHistory({
      end_time: Math.round(this.endDate.getTime() / 1000).toString(),
      start_time: Math.round(this.startDate.getTime() / 1000).toString()
    }));
  }

  resetData() {
    this.endDate = this.today;
    this.startDate = this.lastMonthDay;
  }

  ngOnDestroy() {
    this.resetData();
    this.store.dispatch(new LNDActions.SetForwardingHistory({}));    
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
