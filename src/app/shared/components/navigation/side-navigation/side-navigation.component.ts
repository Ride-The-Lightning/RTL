import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { environment } from '../../../../../environments/environment';

import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Node, Settings, SelNodeInfo, SelNodeInfoChain } from '../../../models/RTLconfig';
import { LoggerService } from '../../../services/logger.service';
import { MenuNode, FlatMenuNode, MENU_DATA } from '../../../models/navMenu';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromApp from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-side-navigation',
  templateUrl: './side-navigation.component.html',
  styleUrls: ['./side-navigation.component.scss']
})
export class SideNavigationComponent implements OnInit, OnDestroy {
  @Output() ChildNavClicked = new EventEmitter<any>();
  public selNode: Node;
  public settings: Settings;
  public version = '';
  public selNodeInfo: SelNodeInfo = {};
  public selNodeInfoChain: SelNodeInfoChain = {};
  public flgLoading = true;
  public logoutNode = [{id: 100, parentId: 0, name: 'Logout', icon: 'eject'}];
  public showLogout = false;
  public numPendingChannels = 0;
  public smallScreen = false;
  private unSubs = [new Subject(), new Subject(), new Subject(), new Subject()];
  treeControl: FlatTreeControl<FlatMenuNode>;
  treeControlLogout: FlatTreeControl<FlatMenuNode>;
  treeFlattener: MatTreeFlattener<MenuNode, FlatMenuNode>;
  treeFlattenerLogout: MatTreeFlattener<MenuNode, FlatMenuNode>;
  navMenus: MatTreeFlatDataSource<MenuNode, FlatMenuNode>;
  navMenusLogout: MatTreeFlatDataSource<MenuNode, FlatMenuNode>;

  constructor(private logger: LoggerService, private store: Store<fromApp.AppState>, private actions$: Actions, private rtlEffects: RTLEffects, private router: Router, private activatedRoute: ActivatedRoute) {
    this.version = environment.VERSION;
    if (MENU_DATA.children[MENU_DATA.children.length - 1].id === 100) {
      MENU_DATA.children.pop();
    }
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<FlatMenuNode>(this.getLevel, this.isExpandable);
    this.navMenus = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    this.navMenus.data = MENU_DATA.children;

    this.treeFlattenerLogout = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControlLogout = new FlatTreeControl<FlatMenuNode>(this.getLevel, this.isExpandable);
    this.navMenusLogout = new MatTreeFlatDataSource(this.treeControlLogout, this.treeFlattenerLogout);
    this.navMenusLogout.data = this.logoutNode;
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(lndStore => {
      this.numPendingChannels = lndStore ? lndStore.numberOfPendingChannels : -1;
      this.logger.info(lndStore);
    });
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromApp.RootState) => {
      // this.selNodeInfo = rtlStore.selNodeInfo;
      this.selNode = rtlStore.selNode;
      this.settings = this.selNode.settings;
      this.showLogout = (sessionStorage.getItem('token')) ? true : false;

      if (undefined !== this.selNodeInfo.identity_pubkey) {
        if (undefined !== this.selNodeInfo.chains && typeof this.selNodeInfo.chains[0] === 'string') {
          this.selNodeInfoChain.chain = this.selNodeInfo.chains[0].toString();
          this.selNodeInfoChain.network = (this.selNodeInfo.testnet) ? 'Testnet' : 'Mainnet';
        } else if (typeof this.selNodeInfo.chains[0] === 'object' && this.selNodeInfo.chains[0].hasOwnProperty('chain')) {
          const getInfoChain = <SelNodeInfoChain>this.selNodeInfo.chains[0];
          this.selNodeInfoChain.chain = getInfoChain.chain;
          this.selNodeInfoChain.network = getInfoChain.network;
        }
      } else {
        this.selNodeInfoChain.chain = '';
        this.selNodeInfoChain.network = '';
      }
      this.flgLoading = (undefined !== this.selNodeInfo.identity_pubkey) ? false : true;

      if (!sessionStorage.getItem('token')) {
        this.flgLoading = false;
      }
      if (window.innerWidth <= 414) {
        this.smallScreen = true;
      }
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === RTLActions.SIGNOUT)
    ).subscribe(() => {
      this.showLogout = false;
    });
  }

  private transformer(node: MenuNode, level: number) { return new FlatMenuNode(!!node.children, level, node.id, node.parentId, node.name, node.icon, node.link); }

  private getLevel(node: FlatMenuNode) { return node.level; }

  private isExpandable(node: FlatMenuNode) { return node.expandable; }

  private getChildren(node: MenuNode): Observable<MenuNode[]> { return of(node.children); }

  hasChild(_: number, _nodeData: FlatMenuNode) { return _nodeData.expandable; }

  toggleTree(node: FlatMenuNode) {
    this.treeControl.collapseAll();
    if (node.parentId === 0) {
      this.treeControl.expandDescendants(node);
      console.warn(this.activatedRoute.firstChild);
      if (this.activatedRoute.firstChild.children.length > 0) {
        this.router.navigate([node.link], {relativeTo: this.activatedRoute.firstChild});
      }
    } else {
      const parentNode = this.treeControl.dataNodes.filter(dataNode => {
        return dataNode.id === node.parentId;
      })[0];
      this.treeControl.expandDescendants(parentNode);
    }
  }

  onClick(node: MenuNode) {
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
