import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, merge, of } from 'rxjs';
import { takeUntil, filter, map, shareReplay, tap, startWith } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCodeBranch, faCode, faCog, faQuestion, faEject, faUserCog } from '@fortawesome/free-solid-svg-icons';

import { GetInfoRoot } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { SessionService } from '../../../services/session.service';
import { GetInfoChain } from '../../../models/lndModels';
import { VERSION, AlertTypeEnum, RTLActions } from '../../../services/consts-enums-functions';
import { RTLEffects } from '../../../../store/rtl.effects';

import { RTLState } from '../../../../store/rtl.state';
import { logout, openConfirmation } from '../../../../store/rtl.actions';
import { rootNodeData } from '../../../../store/rtl.selector';

@Component({
  standalone: false,
  selector: 'rtl-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopMenuComponent implements OnInit, OnDestroy {

  public faUserCog = faUserCog;
  public faCodeBranch = faCodeBranch;
  public faCode = faCode;
  public faCog = faCog;
  public faQuestion = faQuestion;
  public faEject = faEject;
  public version = '';
  public information$: Observable<GetInfoRoot>;
  public showLogout$: Observable<boolean>;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(
    private logger: LoggerService,
    private sessionService: SessionService,
    private store: Store<RTLState>,
    private rtlEffects: RTLEffects,
    private actions: Actions,
    private cdr: ChangeDetectorRef
  ) {
    this.version = VERSION;
  }

  ngOnInit() {
    this.information$ = this.store.select(rootNodeData).pipe(
      takeUntil(this.unSubs[0]),
      tap((nodeData) => this.logger.info(nodeData)),
      shareReplay(1)
    );
    this.showLogout$ = merge(
      this.sessionService.watchSession().pipe(map((session) => !!session.token)),
      this.actions.pipe(
        filter((action) => action.type === RTLActions.LOGOUT),
        map(() => false)
      )
    ).pipe(
      takeUntil(this.unSubs[1]),
      shareReplay(1)
    );
  }

  onClick() {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM,
          alertTitle: 'Logout',
          titleMessage: 'Logout from this device?',
          noBtnText: 'Cancel',
          yesBtnText: 'Logout'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.store.dispatch(logout({ payload: '' }));
        }
      });
  }

  onDonate() {
    window.open('https://www.ridethelightning.info/donate/', '_blank');
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
