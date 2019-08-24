import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { LoggerService } from '../../../services/logger.service';
import { MENU_DATA } from '../../../models/navMenu';

import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-horizontal-navigation',
  templateUrl: './horizontal-navigation.component.html',
  styleUrls: ['./horizontal-navigation.component.scss']
})
export class HorizontalNavigationComponent implements OnInit {
  public menuNodes = [];
  public logoutNode = [];
  public showLogout = false;
  public numPendingChannels = 0;
  private unSubs = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private actions$: Actions, private rtlEffects: RTLEffects) {
  }

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      this.numPendingChannels = rtlStore.numberOfPendingChannels;
      if(+rtlStore.selNode.index === 1) {
        this.menuNodes = MENU_DATA.LNDChildren;
      } else {
        this.menuNodes = MENU_DATA.LNDChildren;
      }
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === RTLActions.SIGNOUT ||  action.type === RTLActions.SIGNIN)
    ).subscribe((action) => {
      this.logger.warn(action);
      if (action.type === RTLActions.SIGNIN) {
        this.menuNodes.push({id: 200, parentId: 0, name: 'Logout', icon: 'eject'});
      }
      if (action.type === RTLActions.SIGNOUT) {
        this.menuNodes.pop();
      }
    });
    if (sessionStorage.getItem('token')) {
      this.menuNodes.push({id: 200, parentId: 0, name: 'Logout', icon: 'eject'});
    }
  }

  onClick(node) {
    if (node.name === 'Logout') {
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
  }
}
