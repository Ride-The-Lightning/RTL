import { Component, OnInit } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

import { LoopTypeEnum } from '../../../services/consts-enums-functions';
import { LoopModalComponent } from './loop-modal/loop-modal.component';
import { LoopQuote, LoopSwapStatus } from '../../../models/loopModels';
import { LoopService } from '../../../services/loop.service';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-loop',
  templateUrl: './loop.component.html',
  styleUrls: ['./loop.component.scss']
})
export class LoopComponent implements OnInit {
  public faInfinity = faInfinity;
  private targetConf = 2;
  public inAmount = 250000;
  public quotes: LoopQuote[] = [];
  public LoopTypeEnum = LoopTypeEnum;
  public selectedSwapType: LoopTypeEnum = LoopTypeEnum.LOOP_OUT;
  public storedSwaps: LoopSwapStatus[] = [];
  public filteredSwaps: LoopSwapStatus[] = [];
  public emptyTableMessage = 'No swap data available.';
  public flgLoading: Array<Boolean | 'error'> = [true];  
  public links = [{link: 'loopout', name: 'Loop Out'}, {link: 'loopin', name: 'Loop In'}];
  public activeTab = this.links[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.loopService.listSwaps();
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeTab = linkFound ? linkFound : this.links[0];
    this.selectedSwapType = linkFound && linkFound.link === 'loopin' ? LoopTypeEnum.LOOP_IN : LoopTypeEnum.LOOP_OUT
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeTab = linkFound ? linkFound : this.links[0];
      this.selectedSwapType = linkFound && linkFound.link === 'loopin' ? LoopTypeEnum.LOOP_IN : LoopTypeEnum.LOOP_OUT
    });
    this.loopService.swapsChanged
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((swaps: LoopSwapStatus[]) => {
      this.flgLoading[0] = false;
      this.storedSwaps = swaps;
      this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType);
    }, (err) => {
      this.flgLoading[0] = 'error';
      this.emptyTableMessage = err.message ? err.message : 'No loop ' + ((this.selectedSwapType === LoopTypeEnum.LOOP_IN) ? 'in' : 'out') +  ' available.';
    });

  }

  onSelectedIndexChange(activeTab: any) {
    this.selectedSwapType = (activeTab.link === 'loopin') ? LoopTypeEnum.LOOP_IN : LoopTypeEnum.LOOP_OUT;
    this.filteredSwaps = this.storedSwaps.filter(swap => swap.type === this.selectedSwapType);
  }

  onLoop(direction: LoopTypeEnum) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    if(direction === LoopTypeEnum.LOOP_IN) {
      this.loopService.getLoopInTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.OpenAlert({data: {
          minQuote: response[0],
          maxQuote: response[1],
          direction: direction,
          component: LoopModalComponent
        }}));    
      });
    } else {
      this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.OpenAlert({data: {
          minQuote: response[0],
          maxQuote: response[1],
          direction: direction,
          component: LoopModalComponent
        }}));    
      });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
  
}
