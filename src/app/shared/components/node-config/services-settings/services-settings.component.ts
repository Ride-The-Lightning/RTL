import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { ConfigSettingsNode } from '../../../models/RTLconfig';
import { Store } from '@ngrx/store';
import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';

@Component({
  selector: 'rtl-services-settings',
  templateUrl: './services-settings.component.html',
  styleUrls: ['./services-settings.component.scss']
})
export class ServicesSettingsComponent implements OnInit, OnDestroy {

  public faLayerGroup = faLayerGroup;
  public links = [{ link: 'loop', name: 'Loop' }, { link: 'boltz', name: 'Boltz' }, { link: 'peerswap', name: 'Peerswap' }];
  public activeLink = '';
  public selNode: ConfigSettingsNode | any;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    if (linkFound) { this.activeLink = linkFound.link; }
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          if (this.selNode.lnImplementation.toUpperCase() === 'CLN') {
            this.activeLink = this.links[2].link;
          } else {
            this.activeLink = linkFound ? linkFound.link : this.links[0].link;
          }
        }
      });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode) => {
      this.selNode = selNode;
      if (this.selNode.lnImplementation.toUpperCase() === 'CLN') {
        this.activeLink = this.links[2].link;
        this.router.navigate(['./' + this.activeLink], { relativeTo: this.activatedRoute });
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
