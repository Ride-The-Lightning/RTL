import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { Node } from '../../../shared/models/RTLconfig';
import { LoggerService } from '../../../shared/services/logger.service';
import { GetInfo, GetInfoChain } from '../../../shared/models/lndModels';
import { environment } from '../../../../environments/environment';

import { RTLEffects } from '../../../shared/store/rtl.effects';
import * as fromRTLReducer from '../../../shared/store/rtl.reducers';
import * as RTLActions from '../../../shared/store/rtl.actions';

@Component({
  selector: 'rtl-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public version = '';
  public information: GetInfo = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public showLogout = false;
  private unSubs = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private rtlEffects: RTLEffects, private actions$: Actions) {
    this.version = environment.VERSION;
  }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      this.selNode = rtlStore.selNode;

      this.information = rtlStore.information;
      this.flgLoading = (undefined !== this.information.identity_pubkey) ? false : true;

      if (undefined !== this.information.identity_pubkey) {
        if (undefined !== this.information.chains && typeof this.information.chains[0] === 'string') {
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
      this.showLogout = (sessionStorage.getItem('token')) ? true : false;

      this.logger.info(rtlStore);
      if (!sessionStorage.getItem('token')) {
        this.flgLoading = false;
      }
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === RTLActions.SIGNOUT)
    ).subscribe(() => {
      this.showLogout = false;
    });
  }

  onClick() {
    this.store.dispatch(new RTLActions.OpenConfirmation({
      width: '70%', data: { type: 'CONFIRM', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
    }}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.showLogout = false;
        this.store.dispatch(new RTLActions.Signout());
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
