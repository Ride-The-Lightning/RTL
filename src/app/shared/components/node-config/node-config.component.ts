import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';

import { ConfigSettingsNode } from '../../models/RTLconfig';
import { RTLState } from '../../../store/rtl.state';
import { rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-node-config',
  templateUrl: './node-config.component.html',
  styleUrls: ['./node-config.component.scss']
})
export class NodeConfigComponent implements OnInit, OnDestroy {

  public faTools = faTools;
  public showLnConfig = false;
  public selNode: ConfigSettingsNode;
  public lnImplementationStr = '';
  public links = [{ link: 'layout', name: 'Layout' }, { link: 'services', name: 'Services' }, { link: 'experimental', name: 'Experimental' }, { link: 'lnconfig', name: this.lnImplementationStr }];
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
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode) => {
      this.showLnConfig = false;
      this.selNode = selNode;
      switch (this.selNode.lnImplementation?.toUpperCase()) {
        case 'CLN':
          this.lnImplementationStr = 'Core Lightning Config';
          break;

        case 'ECL':
          this.lnImplementationStr = 'Eclair Config';
          break;

        default:
          this.lnImplementationStr = 'LND Config';
          break;
      }
      if (this.selNode.authentication && this.selNode.authentication.configPath && this.selNode.authentication.configPath.trim() !== '') {
        this.links[3].name = this.lnImplementationStr;
        this.showLnConfig = true;
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
