import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-cln-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class CLNRoutingComponent implements OnInit, OnDestroy {

  public faMapSigns = faMapSigns;
  public links = [{ link: 'forwardinghistory', name: 'Forwarding History' }, { link: 'routingpeers', name: 'Routing Peers' }, { link: 'failedtransactions', name: 'Failed Transactions' }, { link: 'localfail', name: 'Local Failed Transactions' }];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          this.activeLink = linkFound ? linkFound.link : this.links[0].link;
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
