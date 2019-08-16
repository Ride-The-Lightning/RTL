import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo } from '../../shared/models/clModels';

import * as fromCLReducer from '../store/cl.reducers';

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public information: GetInfo = {};
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private clStore: Store<fromCLReducer.CLState>) {}

  ngOnInit() {
    console.warn('CL HOME');
    this.clStore.select('cl')
    .pipe(takeUntil(this.unsubs[1]))
    .subscribe(clStore => {
      this.information = clStore.information;
      this.logger.info(clStore);
    });
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
