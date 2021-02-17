import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCodeBranch, faCog, faLifeRing, faEject, faUserCog } from '@fortawesome/free-solid-svg-icons';

import { GetInfoRoot, ConfigSettingsNode } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { SessionService } from '../../../services/session.service';
import { GetInfoChain } from '../../../models/lndModels';
import { environment } from '../../../../../environments/environment';
import { AlertTypeEnum } from '../../../services/consts-enums-functions';
import { RTLEffects } from '../../../../store/rtl.effects';

import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopMenuComponent implements OnInit, OnDestroy {
  public selNode: ConfigSettingsNode;
  public faUserCog = faUserCog;
  public faCodeBranch = faCodeBranch;
  public faCog = faCog;
  public faLifeRing = faLifeRing;
  public faEject = faEject;
  public version = '';
  public information: GetInfoRoot = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public showLogout = false;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private sessionService: SessionService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private actions$: Actions) {
    this.version = environment.VERSION;
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.selNode;
      this.information = rtlStore.nodeData;
      this.flgLoading = ( this.information.identity_pubkey) ? false : true;
      if ( this.information.identity_pubkey) {
        if ( this.information.chains && typeof this.information.chains[0] === 'string') {
          this.informationChain.chain = this.information.chains[0].toString();
          this.informationChain.network = (this.information.testnet) ? 'Testnet' : 'Mainnet';
        } else if (typeof this.information.chains[0] === 'object' && this.information.chains[0].hasOwnProperty('chain')) {
          const getInfoChain = <GetInfoChain>this.information.chains[0];
          this.informationChain.chain = getInfoChain.chain;
          this.informationChain.network = getInfoChain.network;
        }
      } else {
        this.informationChain.chain = '';
        this.informationChain.network = '';
      }
      this.logger.info(rtlStore);
    });
    this.sessionService.watchSession()
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(session => {
      this.showLogout = session.token ? true : false;
      this.flgLoading = session.token ? true : false;
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === RTLActions.LOGOUT)
    ).subscribe(() => {
      this.showLogout = false;
    });
  }

  onClick() {
    this.store.dispatch(new RTLActions.OpenConfirmation({
      data: { type: AlertTypeEnum.CONFIRM, alertTitle: 'Logout', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.showLogout = false;
        this.store.dispatch(new RTLActions.Logout());
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
