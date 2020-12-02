import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode, RTLConfiguration } from '../../models/RTLconfig';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

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
  public initializeNodeData = false;
  public links = [{link: 'layout', name: 'Layout'}, {link: 'auth', name: 'Authentication'}];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.initializeNodeData = !!this.activatedRoute.snapshot.paramMap.get('initial');
    this.activeLink = this.links.findIndex(link => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    console.warn(this.activeLink);
    console.warn(this.initializeNodeData);
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = this.links.findIndex(link => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
      console.warn(this.activeLink);
    });
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[1]))
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
      this.links.push({link: 'config', name: this.lnImplementationStr});
      if (this.selNode.authentication && this.selNode.authentication.configPath && this.selNode.authentication.configPath.trim() !== '') {
        this.showLnConfig = true;
      }
      if (this.selNode.settings && this.selNode.settings.bitcoindConfigPath && this.selNode.settings.bitcoindConfigPath.trim() !== '') {
        this.showBitcoind = true;
        this.links.push({link: 'config', name: 'BitcoinD Config'});
      }
    });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/settings/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    if(this.initializeNodeData) {
      this.store.dispatch(new RTLActions.SetSelelectedNode({lnNode: this.selNode, isInitialSetup: true}));
    }
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
