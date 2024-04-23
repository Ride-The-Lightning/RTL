import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faTools } from '@fortawesome/free-solid-svg-icons';
import { openAlert } from '../../../store/rtl.actions';

import { RTLEffects } from '../../../store/rtl.effects';
import { IsAuthorizedComponent } from '../../components/data-modal/is-authorized/is-authorized.component';
import { Node, RTLConfiguration } from '../../models/RTLconfig';
import { RTLState } from '../../../store/rtl.state';
import { rootAppConfig, rootSelectedNode } from '../../../store/rtl.selector';

@Component({
  selector: 'rtl-node-config',
  templateUrl: './node-config.component.html',
  styleUrls: ['./node-config.component.scss']
})
export class NodeConfigComponent implements OnInit, OnDestroy {

  public faTools = faTools;
  public showLnConfig = false;
  public appConfig: RTLConfiguration;
  public selNode: Node | any;
  public lnImplementationStr = '';
  public links = [{ link: 'nodesettings', name: 'Node Settings' }, { link: 'pglayout', name: 'Page Layout' }, { link: 'services', name: 'Services' }, { link: 'experimental', name: 'Experimental' }, { link: 'lnconfig', name: this.lnImplementationStr }];
  public activeLink = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router, private rtlEffects: RTLEffects, private activatedRoute: ActivatedRoute) { }

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
        this.links[4].name = this.lnImplementationStr;
        this.showLnConfig = true;
      }
    });
  }

  showLnConfigClicked() {
    if (!this.appConfig.SSO.rtlSSO) {
      this.store.dispatch(openAlert({
        payload: {
          maxWidth: '50rem',
          data: {
            component: IsAuthorizedComponent
          }
        }
      }));
      this.rtlEffects.closeAlert.pipe(takeUntil(this.unSubs[3])).subscribe((alertRes) => {
        if (alertRes) {
          this.activeLink = this.links[4].link;
          this.router.navigate(['./' + this.activeLink], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.activeLink = this.links[4].link;
      this.router.navigate(['./' + this.activeLink], { relativeTo: this.activatedRoute });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
