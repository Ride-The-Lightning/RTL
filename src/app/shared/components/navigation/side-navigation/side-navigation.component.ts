import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { environment } from '../../../../../environments/environment';

import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { faEject, faEye } from '@fortawesome/free-solid-svg-icons';

import { RTLConfiguration, LightningNode, Settings, GetInfoRoot } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { SessionService } from '../../../services/session.service';
import { GetInfoChain } from '../../../models/lndModels';
import { ShowPubkeyComponent } from '../../../components/data-modal/show-pubkey/show-pubkey.component';
import { MenuChildNode, MENU_DATA } from '../../../models/navMenu';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-side-navigation',
  templateUrl: './side-navigation.component.html',
  styleUrls: ['./side-navigation.component.scss']
})
export class SideNavigationComponent implements OnInit, OnDestroy {
  @Output() ChildNavClicked = new EventEmitter<any>();
  faEject = faEject;
  faEye = faEye;
  public appConfig: RTLConfiguration;
  public selNode: LightningNode;
  public settings: Settings;
  public version = '';
  public information: GetInfoRoot = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public logoutNode = [{id: 200, parentId: 0, name: 'Logout', iconType: 'FA', icon: faEject}];
  public showDataNodes = [{id: 1000, parentId: 0, name: 'Public Key', iconType: 'FA', icon: faEye}];
  public showLogout = false;
  public numPendingChannels = 0;
  public smallScreen = false;
  public childRootRoute = '';
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];
  treeControlNested = new NestedTreeControl<MenuChildNode>(node => node.children);
  treeControlLogout = new NestedTreeControl<MenuChildNode>(node => node.children);
  treeControlShowData = new NestedTreeControl<MenuChildNode>(node => node.children);
  navMenus = new MatTreeNestedDataSource<MenuChildNode>();
  navMenusLogout = new MatTreeNestedDataSource<MenuChildNode>();
  navMenusShowData = new MatTreeNestedDataSource<MenuChildNode>();

  constructor(private logger: LoggerService, private sessionService: SessionService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private rtlEffects: RTLEffects, private router: Router, private activatedRoute: ActivatedRoute) {
    this.version = environment.VERSION;
    if (MENU_DATA.LNDChildren[MENU_DATA.LNDChildren.length - 1].id === 200) {
      MENU_DATA.LNDChildren.pop();
    }
    this.navMenus.data = MENU_DATA.LNDChildren;
    this.navMenusLogout.data = this.logoutNode;
    this.navMenusShowData.data = this.showDataNodes;
  }

  ngOnInit() {
    let token = this.sessionService.getItem('token');
    this.showLogout = token ? true : false;
    this.flgLoading = token ? true : false;
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(rtlStore => {
      this.appConfig = rtlStore.appConfig;
      this.selNode = rtlStore.selNode;
      this.settings = this.selNode.settings;
      this.information = rtlStore.nodeData;
      this.numPendingChannels = rtlStore.nodeData.numberOfPendingChannels;

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

      this.flgLoading = (undefined !== this.information.identity_pubkey) ? false : true;
      if (window.innerWidth <= 414) {
        this.smallScreen = true;
      }
      if(this.selNode && this.selNode.lnImplementation && this.selNode.lnImplementation.toUpperCase() === 'CLT') {
        this.navMenus.data = MENU_DATA.CLChildren;
      } else {
        this.navMenus.data = MENU_DATA.LNDChildren;
      }
      this.logger.info(rtlStore);
    });
    this.sessionService.watchSession()
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(session => {
      this.showLogout = session.token ? true : false;
      this.flgLoading = session.token ? true : false;
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === RTLActions.SIGNOUT))
    .subscribe((action: RTLActions.Signout) => {
      this.showLogout = false;
    });
  }

  hasChild = (_: number, node: MenuChildNode) => !!node.children && node.children.length > 0;  

  onClick(node: MenuChildNode) {
    if (node.name === 'Logout') {
      this.store.dispatch(new RTLActions.OpenConfirmation({
        width: '70%', data: { type: 'CONFIRM', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
      }}));
      this.rtlEffects.closeConfirm
      .pipe(takeUntil(this.unSubs[3]))
      .subscribe(confirmRes => {
        if (confirmRes) {
          this.showLogout = false;
          this.store.dispatch(new RTLActions.Signout());
        }
      });
    }
    this.ChildNavClicked.emit(node);
  }

  onChildNavClicked(node) {
    this.ChildNavClicked.emit(node);
  }
  
  onShowData(node: MenuChildNode) {
    this.store.dispatch(new RTLActions.ShowPubkey());
  }

  onNodeSelectionChange(selNodeValue: LightningNode) {
    this.selNode = selNodeValue;
    this.store.dispatch(new RTLActions.OpenSpinner('Updating Selected Node...'));
    this.store.dispatch(new RTLActions.SetSelelectedNode({ lnNode: selNodeValue, isInitialSetup: false }));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
