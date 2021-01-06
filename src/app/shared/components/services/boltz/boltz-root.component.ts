import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faSync } from '@fortawesome/free-solid-svg-icons';

import { SwapTypeEnum } from '../../../services/consts-enums-functions';
import { SwapModalComponent } from './swap-modal/swap-modal.component';
import { BoltzReverseSwap, BoltzSwap, BoltzListSwaps } from '../../../models/boltzModels';
import { BoltzService } from '../../../services/boltz.service';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-boltz-root',
  templateUrl: './boltz-root.component.html',
  styleUrls: ['./boltz-root.component.scss']
})
export class BoltzRootComponent implements OnInit, OnDestroy {
  public faSync = faSync;
  public swapTypeEnum = SwapTypeEnum;
  public selectedSwapType: SwapTypeEnum = SwapTypeEnum.SWAP_OUT;
  public swaps: BoltzListSwaps = {};
  public swapsData: BoltzSwap[] | BoltzReverseSwap[] = [];
  public emptyTableMessage = '';
  public flgLoading: Array<Boolean | 'error'> = [true];
  public links = [{link: 'swapout', name: 'Swap Out'}, {link: 'swapin', name: 'Swap In'}];
  public activeTab = this.links[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router, private store: Store<fromRTLReducer.RTLState>, private boltzService: BoltzService) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeTab = linkFound ? linkFound : this.links[0];
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeTab = linkFound ? linkFound : this.links[0];
    });
    this.store.dispatch(new RTLActions.OpenSpinner('Getting List Swaps...'));
    this.boltzService.listSwaps()
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((swaps: BoltzListSwaps) => {
      this.store.dispatch(new RTLActions.CloseSpinner());      
      this.swaps = swaps;
      this.flgLoading[0] = false;
      if(this.selectedSwapType === SwapTypeEnum.SWAP_IN) {
        this.swapsData = swaps.swaps;
      } else {
        this.swapsData = swaps.reverseSwaps;
      }
    }, (err) => {
      this.flgLoading[0] = 'error';
      this.emptyTableMessage = (err.message ? (' ' + err.message + '.') : ('No swap ' + ((this.selectedSwapType === SwapTypeEnum.SWAP_IN) ? 'in' : 'out') +  ' available.'));
    });
  }

  onSelectedIndexChange(activeTab: any) {
    if(activeTab.link === 'swapin') {
      this.selectedSwapType = SwapTypeEnum.SWAP_IN;
      this.swapsData = this.swaps.swaps;
    } else {
      this.selectedSwapType = SwapTypeEnum.SWAP_OUT;
      this.swapsData = this.swaps.reverseSwaps;
    }
  }

  onSwap(direction: SwapTypeEnum) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Service Info...'));
    this.boltzService.serviceInfo()
    .pipe(takeUntil(this.unSubs[2]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({data: {
        serviceInfo: response,
        direction: direction,
        component: SwapModalComponent
      }}));    
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
  
}
