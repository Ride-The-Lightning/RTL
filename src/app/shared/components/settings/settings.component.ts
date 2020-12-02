import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy{
  public faTools = faTools;
  public showLnConfig = false;
  public showBitcoind = false;
  public selNode: ConfigSettingsNode;
  public appConfig: RTLConfiguration;
  public lnImplementationStr = '';
  public links = [{link: 'layout', name: 'Layout'}, {link: 'auth', name: 'Authentication'}, {link: 'lnconfig', name: this.lnImplementationStr}, {link: 'bconfig', name: 'BitcoinD Config'}];
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
      this.showLnConfig = false;
      this.showBitcoind = false;
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      switch (this.selNode.lnImplementation.toUpperCase()) {
        case 'CLT':
          this.lnImplementationStr = 'C-Lightning Config';
          break;
      
        case 'ECL':
          this.lnImplementationStr = 'Eclair Config';
          break;

        default:
          this.lnImplementationStr = 'LND Config';
          break;
      }
      if (this.selNode.authentication && this.selNode.authentication.configPath && this.selNode.authentication.configPath.trim() !== '') {
        this.links[2].name = this.lnImplementationStr;
        this.showLnConfig = true;
      }
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
