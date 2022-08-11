import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { CLNOnChainSendModalComponent } from '../on-chain-send-modal/on-chain-send-modal.component';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-cln-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class CLNOnChainSendComponent implements OnInit, OnDestroy {

  public sweepAll = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.data.pipe(takeUntil(this.unSubs[0])).subscribe((routeData) => {
      this.sweepAll = routeData.sweepAll;
    });
  }

  openSendFundsModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          sweepAll: this.sweepAll,
          component: CLNOnChainSendModalComponent
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
