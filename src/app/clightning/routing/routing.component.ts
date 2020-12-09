import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as CLActions from '../store/cl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';


@Component({
  selector: 'rtl-cl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class CLRoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public lastOffsetIndex = 0;
  public successfulData = [];
  public failedData = [];
  public filteredData = false;
  public today = new Date(Date.now());
  public lastMonthDay = new Date(this.today.getFullYear(), this.today.getMonth() - 1, this.today.getDate() + 1, 0, 0, 0);
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, 0, 0, 0);
  public endDate = this.today;
  public startDate = this.lastMonthDay;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public errorMessage = '';
  public links = [{link: 'forwardinghistory', name: 'Forwarding History'}, {link: 'failedtransactions', name: 'Failed Transactions'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

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
    if (!this.endDate) { this.endDate = new Date(); }
    if (!this.startDate) { this.startDate = this.lastMonthDay; }
    this.store.dispatch(new CLActions.GetForwardingHistory());
  }

  resetData() {
    this.endDate = new Date();
    this.startDate = this.lastMonthDay;
    this.successfulData = [];
    this.failedData = [];
    this.lastOffsetIndex = 0;
  }

  ngOnDestroy() {
    this.resetData();
    this.store.dispatch(new CLActions.SetForwardingHistory({}));
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
