import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class CLRoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public links = [{link: 'forwardinghistory', name: 'Forwarding History'}, {link: 'failedtransactions', name: 'Failed Transactions'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
