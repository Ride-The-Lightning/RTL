import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUserCog } from '@fortawesome/free-solid-svg-icons';

import { Node, RTLConfiguration } from '../../models/RTLconfig';
import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode, rootAppConfig } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public faUserCog = faUserCog;
  public showBitcoind = false;
  public selNode: Node | any;
  public appConfig: RTLConfiguration;
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
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[1])).subscribe((appConfig) => {
      this.appConfig = appConfig;
    });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[2])).subscribe((selNode) => {
      this.showBitcoind = false;
      this.selNode = selNode;
      if (this.selNode.settings && this.selNode.Settings.bitcoindConfigPath && this.selNode.Settings.bitcoindConfigPath.trim() !== '') {
        this.showBitcoind = true;
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
