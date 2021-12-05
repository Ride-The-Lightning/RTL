import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';

import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { ConfigSettingsNode } from '../../../models/RTLconfig';

@Component({
  selector: 'rtl-services-settings',
  templateUrl: './services-settings.component.html',
  styleUrls: ['./services-settings.component.scss']
})
export class ServicesSettingsComponent implements OnInit, OnDestroy {

  public faLayerGroup = faLayerGroup;
  public links = [{ link: 'loop', name: 'Loop', implementation: 'LND' }, { link: 'boltz', name: 'Boltz', implementation: 'LND' }, { link: 'offers', name: 'Offers', implementation: 'CLT' }];
  public activeLink = '';
  public selNode: ConfigSettingsNode;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        const linkFound = this.links.find((link) => value.urlAfterRedirects.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode: ConfigSettingsNode) => {
      this.selNode = selNode;
      if (this.selNode.lnImplementation === 'CLT') {
        let prevActiveLink = this.activeLink;
        this.activeLink = this.links[2].link;
        if (prevActiveLink !== this.activeLink) {
          this.router.navigate(['./', this.activeLink], { relativeTo: this.activatedRoute });
        }
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
