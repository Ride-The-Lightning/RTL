import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { UserIdleService } from 'angular-user-idle';

import { LoggerService } from '../shared/services/logger.service';
import { RTLConfiguration, Settings, Node } from '../shared/models/RTLconfig';
import { GetInfo } from '../shared/models/lndModels';

import * as LNDActions from '../lnd/store/lnd.actions';
import * as CLActions from '../c-lightning/store/cl.actions';
import * as RTLActions from '../store/rtl.actions';
import * as fromApp from '../store/rtl.reducers';

@Component({
  selector: 'rtl-super-user-dashboard',
  templateUrl: './super-user-dashboard.component.html',
  styleUrls: ['./super-user-dashboard.component.scss']
})
export class SuperUserDashboardComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public settings: Settings;
  public information: GetInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgCopied = false;
  public appConfig: RTLConfiguration;
  public accessKey = '';
  public smallScreen = false;
  unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromApp.AppState>, private actions$: Actions, private userIdle: UserIdleService, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.actions$.pipe(takeUntil(this.unSubs[3]), filter(action => action.type === RTLActions.SET_RTL_CONFIG))
    .subscribe((setConfigAction: RTLActions.SetRTLConfig) => {
      console.warn(setConfigAction);
      this.selNode = setConfigAction.payload.nodes.find(node => +node.index === setConfigAction.payload.selectedNodeIndex)
      if (this.selNode.lnImplementation.toLowerCase() === 'clightning') {
        this.store.dispatch(new CLActions.FetchCLInfo());
        this.router.navigate(['../cl'], { relativeTo: this.activatedRoute });
      } else {
        this.store.dispatch(new LNDActions.FetchInfo());
        this.router.navigate(['../lnd'], { relativeTo: this.activatedRoute });
      }
    });    
    // this.store.select('rtlRoot')
    // .pipe(takeUntil(this.unSubs[0]))
    // .subscribe(rtlStore => {
    //   this.selNode = rtlStore.selNode;
    //   if (this.selNode.lnImplementation.toLowerCase() === 'clightning') {
    //     this.store.dispatch(new CLActions.FetchCLInfo());
    //     this.router.navigate(['./cl'], { relativeTo: this.activatedRoute });
    //   } else {
    //     this.store.dispatch(new LNDActions.FetchInfo());
    //     this.router.navigate(['./lnd'], { relativeTo: this.activatedRoute });
    //   }
    // });
  }

  ngOnDestroy() {
    this.unSubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }

}
