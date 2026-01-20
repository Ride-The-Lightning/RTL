import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, map, shareReplay } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';

import { Node, RTLConfiguration } from '../../models/RTLconfig';
import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode, rootAppConfig } from '../../../store/rtl.selector';

@Component({
  standalone: false,
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public faUserCog = faUserCog;
  public appConfig$: Observable<RTLConfiguration>;
  public showBitcoind$: Observable<boolean>;
  public links = [{ link: 'app', name: 'Application' }, { link: 'auth', name: 'Authentication' }, { link: 'bconfig', name: 'BitcoinD Config' }];
  public activeLink = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router) { }

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
    this.appConfig$ = this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[1]), shareReplay(1));
    this.showBitcoind$ = this.store.select(rootSelectedNode).pipe(
      takeUntil(this.unSubs[2]),
      map((selNode) => !!(selNode?.settings?.bitcoindConfigPath?.trim())),
      shareReplay(1)
    );
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
