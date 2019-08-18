import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo } from '../../shared/models/clModels';

import * as fromApp from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public information: GetInfo = {};
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromApp.AppState>) {}

  ngOnInit() {
    console.warn('CL HOME');
    this.store.select('cl')
    .pipe(takeUntil(this.unsubs[1]))
    .subscribe(clStore => {
      this.information = clStore.information;
      if (undefined !== this.information.identity_pubkey) {
        this.initializeRemainingData();
      }      
      this.logger.info(clStore);
    });
  }

  initializeRemainingData() {
    console.warn('SOMETHING IS WRONG HERE');
    // this.store.dispatch(new CLActions.FetchCLFees());

    // this.store.dispatch(new CLActions.FetchPeers());
    // this.store.dispatch(new CLActions.FetchBalance('channels'));
    // this.store.dispatch(new CLActions.FetchFees());
    // this.store.dispatch(new CLActions.FetchNetwork());
    // this.store.dispatch(new CLActions.FetchChannels({routeParam: 'all'}));
    // this.store.dispatch(new CLActions.FetchChannels({routeParam: 'pending'}));
    // this.store.dispatch(new CLActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    // this.store.dispatch(new CLActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
