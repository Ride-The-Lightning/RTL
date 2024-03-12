import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
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
  // public links = [{ link: 'loop', name: 'Loop' }, { link: 'boltz', name: 'Boltz' }, { link: 'peerswap', name: 'Peerswap' }, { link: 'noservice', name: 'No Service' }];
  public links = [{ link: 'loop', name: 'Loop' }, { link: 'boltz', name: 'Boltz' }, { link: 'noservice', name: 'No Service' }];
  public activeLink = '';
  public selNode: ConfigSettingsNode | any;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.setActiveLink();
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          this.setActiveLink();
        }
      });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((selNode) => {
      this.selNode = selNode;
      this.setActiveLink();
      this.router.navigate(['./' + this.activeLink], { relativeTo: this.activatedRoute });
    });
  }

  setActiveLink() {
    if (this.selNode && this.selNode.settings) {
      if (this.selNode.settings.swapServerUrl && this.selNode.settings.swapServerUrl.trim() !== '') {
        this.activeLink = this.links[0].link;
      } else if (this.selNode.settings.boltzServerUrl && this.selNode.settings.boltzServerUrl.trim() !== '') {
        this.activeLink = this.links[1].link;
      } else if (this.selNode.settings.enablePeerswap) {
        this.activeLink = this.links[2].link;
      } else {
        this.activeLink = this.links[this.links.length - 1].link;
      }
    } else {
      this.activeLink = this.links[this.links.length - 1].link;
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
