import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource, MatTree } from '@angular/material/tree';
import { faEject, faEye } from '@fortawesome/free-solid-svg-icons';

import { RTLConfiguration, Node, Settings, GetInfoRoot } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { SessionService } from '../../../services/session.service';
import { GetInfoChain } from '../../../models/lndModels';
import { MenuChildNode, MENU_DATA } from '../../../models/navMenu';

import { RTLEffects } from '../../../../store/rtl.effects';
import { RTLState } from '../../../../store/rtl.state';
import { VERSION, AlertTypeEnum, RTLActions, UI_MESSAGES, UserPersonaEnum } from '../../../services/consts-enums-functions';
import { CommonService } from '../../../services/common.service';
import { logout, openConfirmation, setSelectedNode, showPubkey } from '../../../../store/rtl.actions';
import { rootAppConfig, rootSelNodeAndNodeData } from '../../../../store/rtl.selector';

@Component({
  selector: 'rtl-side-navigation',
  templateUrl: './side-navigation.component.html',
  styleUrls: ['./side-navigation.component.scss']
})
export class SideNavigationComponent implements OnInit, OnDestroy {

  @ViewChild(MatTree, { static: false }) tree: any;
  @Output() readonly ChildNavClicked = new EventEmitter<any>();
  faEject = faEject;
  faEye = faEye;
  public appConfig: RTLConfiguration;
  public selConfigNodeIndex: Number;
  public selNode: Node | any;
  public settings: Settings | null;
  public version = '';
  public information: GetInfoRoot = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public logoutNode = [{ id: 200, parentId: 0, name: 'Logout', iconType: 'FA', icon: faEject }];
  public showDataNodes = [{ id: 1000, parentId: 0, name: 'Public Key', iconType: 'FA', icon: faEye }];
  public showLogout = false;
  public numPendingChannels = 0;
  public smallScreen = false;
  public childRootRoute = '';
  public userPersonaEnum = UserPersonaEnum;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];
  treeControlNested = new NestedTreeControl<MenuChildNode>((node) => node.children);
  treeControlLogout = new NestedTreeControl<MenuChildNode>((node) => node.children);
  treeControlShowData = new NestedTreeControl<MenuChildNode>((node) => node.children);
  navMenus = new MatTreeNestedDataSource<MenuChildNode>();
  navMenusLogout = new MatTreeNestedDataSource<MenuChildNode>();
  navMenusShowData = new MatTreeNestedDataSource<MenuChildNode>();

  constructor(private logger: LoggerService, private commonService: CommonService, private sessionService: SessionService, private store: Store<RTLState>, private actions: Actions, private rtlEffects: RTLEffects) {
    this.version = VERSION;
    if (MENU_DATA.LNDChildren && MENU_DATA.LNDChildren[MENU_DATA.LNDChildren.length - 1].id === 200) {
      MENU_DATA.LNDChildren.pop();
    }
    this.navMenus.data = MENU_DATA.LNDChildren || [];
    this.navMenusLogout.data = this.logoutNode;
    this.navMenusShowData.data = this.showDataNodes;
  }

  ngOnInit() {
    const token = this.sessionService.getItem('token');
    this.showLogout = !!token;
    this.flgLoading = !!token;
    this.store.select(rootAppConfig).pipe(takeUntil(this.unSubs[0])).subscribe((appConfig) => {
      this.appConfig = appConfig;
    });
    this.store.select(rootSelNodeAndNodeData).pipe(takeUntil(this.unSubs[1])).
      subscribe((rootData: { nodeDate: GetInfoRoot, selNode: Node | null }) => {
        this.information = rootData.nodeDate;
        if (this.information.identity_pubkey) {
          if (this.information.chains && typeof this.information.chains[0] === 'string') {
            this.informationChain.chain = this.information.chains[0].toString();
            this.informationChain.network = (this.information.testnet) ? 'Testnet' : 'Mainnet';
          } else if (this.information && this.information.chains && this.information.chains.length && this.information.chains.length > 0 && typeof this.information.chains[0] === 'object' && this.information.chains[0].hasOwnProperty('chain')) {
            const getInfoChain = <GetInfoChain>this.information.chains[0];
            this.informationChain.chain = getInfoChain.chain;
            this.informationChain.network = getInfoChain.network;
          }
        } else {
          this.informationChain.chain = '';
          this.informationChain.network = '';
        }
        this.flgLoading = !(this.information.identity_pubkey);
        if (window.innerWidth <= 414) {
          this.smallScreen = true;
        }
        this.selNode = rootData.selNode;
        this.settings = this.selNode?.settings || null;
        this.selConfigNodeIndex = +(rootData.selNode?.index || 0);
        if (this.selNode && this.selNode.lnImplementation) {
          this.filterSideMenuNodes();
        }
        this.logger.info(rootData);
      });
    this.sessionService.watchSession().
      pipe(takeUntil(this.unSubs[2])).
      subscribe((session) => {
        this.showLogout = !!session.token;
        this.flgLoading = !!session.token;
      });
    this.actions.pipe(
      takeUntil(this.unSubs[3]),
      filter((action) => action.type === RTLActions.LOGOUT)).
      subscribe((action: any) => {
        this.showLogout = false;
      });
  }

  hasChild = (_: number, node: MenuChildNode) => !!node.children && node.children.length > 0;

  onClick(node: MenuChildNode) {
    if (node.name === 'Logout') {
      this.store.dispatch(openConfirmation({
        payload: {
          data: {
            type: AlertTypeEnum.CONFIRM, alertTitle: 'Logout', titleMessage: 'Logout from this device?', noBtnText: 'Cancel', yesBtnText: 'Logout'
          }
        }
      }));
      this.rtlEffects.closeConfirm.
        pipe(takeUntil(this.unSubs[4])).
        subscribe((confirmRes) => {
          if (confirmRes) {
            this.showLogout = false;
            this.store.dispatch(logout());
          }
        });
    }
    this.ChildNavClicked.emit(node);
  }

  onChildNavClicked(node) {
    this.ChildNavClicked.emit(node);
  }

  filterSideMenuNodes() {
    switch (this.selNode?.lnImplementation?.toUpperCase()) {
      case 'CLN':
        this.loadCLNMenu();
        break;

      case 'ECL':
        this.loadECLMenu();
        break;

      default:
        this.loadLNDMenu();
        break;
    }
  }

  loadLNDMenu() {
    let clonedMenu = [];
    clonedMenu = JSON.parse(JSON.stringify(MENU_DATA.LNDChildren));
    this.navMenus.data = clonedMenu?.filter((navMenuData: any) => {
      if (navMenuData.children && navMenuData.children.length) {
        navMenuData.children = navMenuData.children?.filter((navMenuChild) => ((navMenuChild.userPersona === UserPersonaEnum.ALL || navMenuChild.userPersona === this.settings?.userPersona) && navMenuChild.link !== '/services/loop' && navMenuChild.link !== '/services/boltz') ||
          (navMenuChild.link === '/services/loop' && this.settings?.swapServerUrl && this.settings.swapServerUrl.trim() !== '') ||
          (navMenuChild.link === '/services/boltz' && this.settings?.boltzServerUrl && this.settings.boltzServerUrl.trim() !== ''));
        return navMenuData.children.length > 0;
      }
      return navMenuData.userPersona === UserPersonaEnum.ALL || navMenuData.userPersona === this.settings?.userPersona;
    });
  }

  loadCLNMenu() {
    let clonedMenu = [];
    clonedMenu = JSON.parse(JSON.stringify(MENU_DATA.CLNChildren));
    this.navMenus.data = clonedMenu?.filter((navMenuData: any) => {
      if (navMenuData.children && navMenuData.children.length) {
        navMenuData.children = navMenuData.children?.filter((navMenuChild) => ((navMenuChild.userPersona === UserPersonaEnum.ALL || navMenuChild.userPersona === this.settings?.userPersona) && navMenuChild.link !== '/services/peerswap') ||
          (navMenuChild.link === '/services/peerswap' && this.settings?.enablePeerswap) ||
          (navMenuChild.link === '/services/boltz' && this.settings?.boltzServerUrl && this.settings.boltzServerUrl.trim() !== ''));
        return navMenuData.children.length > 0;
      }
      return navMenuData.userPersona === UserPersonaEnum.ALL || navMenuData.userPersona === this.settings?.userPersona;
    });
  }

  loadECLMenu() {
    this.navMenus.data = JSON.parse(JSON.stringify(MENU_DATA.ECLChildren));
  }

  onShowData(node: MenuChildNode) {
    this.store.dispatch(showPubkey());
    this.ChildNavClicked.emit('showData');
  }

  onNodeSelectionChange(selNodeValue: Number) {
    const prevIndex = this.selConfigNodeIndex;
    this.selConfigNodeIndex = selNodeValue;
    const foundNode = this.appConfig.nodes.find((node: any) => +node.index === selNodeValue);
    this.store.dispatch(setSelectedNode({ payload: { uiMessage: UI_MESSAGES.UPDATE_SELECTED_NODE, prevLnNodeIndex: +prevIndex, currentLnNode: (foundNode || null), isInitialSetup: false } }));
    this.ChildNavClicked.emit('selectNode');
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
