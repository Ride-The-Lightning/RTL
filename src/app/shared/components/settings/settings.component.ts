import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy{
  public faUserCog = faUserCog;
  public showBitcoind = false;
  public selNode: ConfigSettingsNode;
  public appConfig: RTLConfiguration;
  public links = [{link: 'app', name: 'Application'}, {link: 'auth', name: 'Authentication'}, {link: 'bconfig', name: 'BitcoinD Config'}];
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
      this.showBitcoind = false;
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      if (this.selNode.settings && this.selNode.settings.bitcoindConfigPath && this.selNode.settings.bitcoindConfigPath.trim() !== '') {
        this.showBitcoind = true;
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
