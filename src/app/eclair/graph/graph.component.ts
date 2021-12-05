import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'rtl-ecl-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class ECLGraphComponent implements OnInit, OnDestroy {

  faSearch = faSearch;
  public links = [{ link: 'lookups', name: 'Lookup' }, { link: 'queryroutes', name: 'Query Routes' }];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        const linkFound = this.links.find((link) => value.urlAfterRedirects.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
