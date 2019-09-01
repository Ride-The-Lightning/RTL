import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { environment } from '../../../../../environments/environment';

import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { LightningNode, Settings, GetInfoRoot } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { GetInfoChain } from '../../../models/lndModels';
import { MenuChildNode, FlatMenuNode, MENU_DATA } from '../../../models/navMenu';

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
  public selNode: LightningNode;
  public settings: Settings;
  public version = '';
  public information: GetInfoRoot = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public logoutNode = [{id: 200, parentId: 0, name: 'Logout', icon: 'eject'}];
  public showLogout = false;
  public numPendingChannels = 0;
  public smallScreen = false;
  public childRootRoute = '';
  private unSubs = [new Subject(), new Subject(), new Subject()];
  treeControl: FlatTreeControl<FlatMenuNode>;
  treeControlLogout: FlatTreeControl<FlatMenuNode>;
  treeFlattener: MatTreeFlattener<MenuChildNode, FlatMenuNode>;
  treeFlattenerLogout: MatTreeFlattener<MenuChildNode, FlatMenuNode>;
  navMenus: MatTreeFlatDataSource<MenuChildNode, FlatMenuNode>;
  navMenusLogout: MatTreeFlatDataSource<MenuChildNode, FlatMenuNode>;

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private rtlEffects: RTLEffects, private router: Router, private activatedRoute: ActivatedRoute) {
    this.version = environment.VERSION;
    if (MENU_DATA.LNDChildren[MENU_DATA.LNDChildren.length - 1].id === 200) {
      MENU_DATA.LNDChildren.pop();
    }
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FlatMenuNode>(this.getLevel, this.isExpandable);
    this.navMenus = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.navMenus.data = MENU_DATA.LNDChildren;

    this.treeFlattenerLogout = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControlLogout = new FlatTreeControl<FlatMenuNode>(this.getLevel, this.isExpandable);
    this.navMenusLogout = new MatTreeFlatDataSource(this.treeControlLogout, this.treeFlattenerLogout);
    this.navMenusLogout.data = this.logoutNode;
  }

  ngOnInit() {
    this.store.select('root')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(rtlStore => {
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
      this.showLogout = (sessionStorage.getItem('token')) ? true : false;
      if (!sessionStorage.getItem('token')) {
        this.flgLoading = false;
      }
      if (window.innerWidth <= 414) {
        this.smallScreen = true;
      }
      if(this.selNode && this.selNode.lnImplementation && this.selNode.lnImplementation.toLowerCase() === 'clightning') {
        this.navMenus.data = MENU_DATA.CLChildren;
      } else {
        this.navMenus.data = MENU_DATA.LNDChildren;
      }
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === RTLActions.SIGNOUT))
    .subscribe((action: RTLActions.Signout) => {
      this.showLogout = false;
    });
  }

  private transformer(node: MenuChildNode, level: number) { return new FlatMenuNode(!!node.children, level, node.id, node.parentId, node.name, node.icon, node.link); }

  private getLevel(node: FlatMenuNode) { return node.level; }

  private isExpandable(node: FlatMenuNode) { return node.expandable; }

  private getChildren(node: MenuChildNode): Observable<MenuChildNode[]> { return of(node.children); }

  hasChild(_: number, _nodeData: FlatMenuNode) { return _nodeData.expandable; }

  toggleTree(node: FlatMenuNode) {
    this.treeControl.collapseAll();
    if (node.parentId === 0) {
      this.treeControl.expandDescendants(node);
      this.router.navigate([node.link], {relativeTo: this.activatedRoute.firstChild});
    } else {
      const parentNode = this.treeControl.dataNodes.filter(dataNode => {
        return dataNode.id === node.parentId;
      })[0];
      this.treeControl.expandDescendants(parentNode);
    }
  }

  onClick(node: MenuChildNode) {
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
    this.ChildNavClicked.emit(node);
  }

  onChildNavClicked(node) {
    this.ChildNavClicked.emit(node);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
