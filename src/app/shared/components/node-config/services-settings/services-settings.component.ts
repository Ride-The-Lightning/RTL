import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../../models/RTLconfig';

import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-services-settings',
  templateUrl: './services-settings.component.html',
  styleUrls: ['./services-settings.component.scss']
})
export class ServicesSettingsComponent implements OnInit, OnDestroy {
  public faLayerGroup = faLayerGroup;
  public selNode: ConfigSettingsNode;
  public appConfig: RTLConfiguration;
  public links = [{link: 'loop', name: 'Loop'}, {link: 'boltz', name: 'Boltz'}];
  public activeLink = '';
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
    this.store.select('root').pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
