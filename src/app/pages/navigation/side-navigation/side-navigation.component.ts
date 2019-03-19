import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { environment } from '../../../../environments/environment';

import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

import { Settings } from '../../../shared/models/RTLconfig';
import { LoggerService } from '../../../shared/services/logger.service';
import { GetInfo, GetInfoChain } from '../../../shared/models/lndModels';
import { MenuNode, FlatMenuNode, MENU_DATA } from '../../../shared/models/navMenu';

import { RTLEffects } from '../../../shared/store/rtl.effects';
import * as RTLActions from '../../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-side-navigation',
  templateUrl: './side-navigation.component.html',
  styleUrls: ['./side-navigation.component.scss']
})
export class SideNavigationComponent implements OnInit, OnDestroy {
  @Output() ChildNavClicked = new EventEmitter<any>();
  public version = '';
  public settings: Settings;
  public information: GetInfo = {};
  public informationChain: GetInfoChain = {};
  public flgLoading = true;
  public logoutNode = [{id: 100, parentId: 0, name: 'Logout', icon: 'eject'}];
  public showLogout = false;
  public numPendingChannels = 0;
  public smallScreen = false;
  private unSubs = [new Subject(), new Subject(), new Subject()];
  treeControl: FlatTreeControl<FlatMenuNode>;
  treeControlLogout: FlatTreeControl<FlatMenuNode>;
  treeFlattener: MatTreeFlattener<MenuNode, FlatMenuNode>;
  treeFlattenerLogout: MatTreeFlattener<MenuNode, FlatMenuNode>;
  navMenus: MatTreeFlatDataSource<MenuNode, FlatMenuNode>;
  navMenusLogout: MatTreeFlatDataSource<MenuNode, FlatMenuNode>;

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private actions$: Actions, private rtlEffects: RTLEffects, private router: Router) {
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
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      this.settings = rtlStore.settings;
      this.information = rtlStore.information;
      this.numPendingChannels = rtlStore.numberOfPendingChannels;

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
      this.router.navigate([node.link]);
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
