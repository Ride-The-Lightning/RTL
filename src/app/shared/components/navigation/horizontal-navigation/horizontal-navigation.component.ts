import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { faEject } from '@fortawesome/free-solid-svg-icons';
import { SessionService } from '../../../services/session.service';
import { MENU_DATA } from '../../../models/navMenu';
import { ShowPubkeyComponent } from '../../data-modal/show-pubkey/show-pubkey.component';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { GetInfoRoot } from '../../../models/RTLconfig';

@Component({
  selector: 'rtl-horizontal-navigation',
  templateUrl: './horizontal-navigation.component.html',
  styleUrls: ['./horizontal-navigation.component.scss']
})
export class HorizontalNavigationComponent implements OnInit, OnDestroy {
  public menuNodes = [];
  public logoutNode = [];
  public showLogout = false;
  public numPendingChannels = 0;
  public information: GetInfoRoot = {};
  private unSubs = [new Subject(), new Subject(), new Subject()];

  constructor(private sessionService: SessionService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.information = rtlStore.nodeData;
      this.numPendingChannels = rtlStore.nodeData.numberOfPendingChannels;
      if(rtlStore.selNode.lnImplementation.toUpperCase() === 'CLT') {
        this.menuNodes = MENU_DATA.CLChildren;
      } else {
        this.menuNodes = MENU_DATA.LNDChildren;
      }
      if(this.sessionService.getItem('token') && this.menuNodes[this.menuNodes.length - 1].id !== 200) {
        this.menuNodes.push({id: 200, parentId: 0, name: 'Logout', iconType: 'FA', icon: faEject});
      } else {
        if(this.menuNodes[this.menuNodes.length - 1].id === 200) {
          this.menuNodes.pop();
        }
      }
    });
    this.sessionService.watchSession()
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(session => {
      if(session.token) {
        this.menuNodes.push({id: 200, parentId: 0, name: 'Logout', iconType: 'FA', icon: faEject});
      } else {
        if(this.menuNodes[this.menuNodes.length - 1].id === 200) {
          this.menuNodes.pop();
        }
      }
    });
  }

  onClick(node) {
    if (node.name === 'Logout') {
      this.store.dispatch(new RTLActions.OpenConfirmation({
        width: '70%', data: { type: 'CONFIRM', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[2]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.showLogout = false;
          this.store.dispatch(new RTLActions.Signout());
        }
      });
    }
  }

  onShowPubkey() {
    this.store.dispatch(new RTLActions.ShowPubkey());
  }  

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
