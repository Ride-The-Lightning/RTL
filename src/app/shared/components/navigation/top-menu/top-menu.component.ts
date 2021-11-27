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
import { AlertTypeEnum, RTLActions } from '../../../services/consts-enums-functions';
import { RTLEffects } from '../../../../store/rtl.effects';

import { RTLState } from '../../../../store/rtl.state';
import { logout, openConfirmation } from '../../../../store/rtl.actions';
import { rootNodeData } from '../../../../store/rtl.selector';

@Component({
  selector: 'rtl-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopMenuComponent implements OnInit, OnDestroy {

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

  constructor(private logger: LoggerService, private sessionService: SessionService, private store: Store<RTLState>, private rtlEffects: RTLEffects, private actions: Actions) {
    this.version = environment.VERSION;
  }

  ngOnInit() {
    this.store.select(rootNodeData).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeData) => {
        this.information = nodeData;
        this.flgLoading = !(this.information.identity_pubkey);
        if (this.information.identity_pubkey) {
          if (this.information.chains && typeof this.information.chains[0] === 'string') {
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
        this.logger.info(nodeData);
      });
    this.sessionService.watchSession().
      pipe(takeUntil(this.unSubs[1])).
      subscribe((session) => {
        this.showLogout = !!session.token;
        this.flgLoading = !!session.token;
      });
    this.actions.
      pipe(
        takeUntil(this.unSubs[2]),
        filter((action) => action.type === RTLActions.LOGOUT)
      ).subscribe(() => {
        this.showLogout = false;
      });
  }

  onClick() {
    this.store.dispatch(openConfirmation({
      payload: {
        data: {
          type: AlertTypeEnum.CONFIRM, alertTitle: 'Logout', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
        }
      }
    }));
    this.rtlEffects.closeConfirm.
      pipe(takeUntil(this.unSubs[3])).
      subscribe((confirmRes) => {
        if (confirmRes) {
          this.showLogout = false;
          this.store.dispatch(logout());
        }
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
