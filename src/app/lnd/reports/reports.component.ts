import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faChartBar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {
  public faChartBar = faChartBar;
  public links = ['fees', 'payments'];
  public activeLink = this.links[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router) {}

  ngOnInit() {
    this.activeLink = this.router.url.substring(this.router.url.lastIndexOf('/') + 1);
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
