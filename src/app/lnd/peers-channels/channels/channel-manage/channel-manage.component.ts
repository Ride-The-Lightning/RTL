import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Channel, Peer, GetInfo } from '../../../../shared/models/lndModels';
import { TRANS_TYPES, AlertTypeEnum, DataTypeEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';

import { LNDEffects } from '../../../store/lnd.effects';
import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-manage',
  templateUrl: './channel-manage.component.html',
  styleUrls: ['./channel-manage.component.scss']
})
export class ChannelManageComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public totalBalance = 0;
  public selectedPeer = '';
  public fundingAmount: number;
  public peers: Peer[] = [];
  public information: GetInfo = {};
  public myChanPolicy: any = {};
  public transTypes = TRANS_TYPES;
  public selTransType = '0';
  public transTypeValue = {blocks: '', fees: ''};
  public spendUnconfirmed = false;
  public isPrivate = false;
  public showAdvanced = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      this.information = rtlStore.information;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (undefined === peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });
      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      this.logger.info(rtlStore);
    });
  }

  onOpenChannel() {
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    let transTypeValue = '0';
    if (this.selTransType === '1') {
      transTypeValue = this.transTypeValue.blocks;
    } else if (this.selTransType === '2') {
      transTypeValue = this.transTypeValue.fees;
    }
    this.store.dispatch(new RTLActions.SaveNewChannel({
      selectedPeerPubkey: this.selectedPeer, fundingAmount: this.fundingAmount, private: this.isPrivate,
      transType: this.selTransType, transTypeValue: transTypeValue, spendUnconfirmed: this.spendUnconfirmed
    }));
  }

  resetData() {
    this.selectedPeer = '';
    this.fundingAmount = 0;
    this.showAdvanced = false;
    this.spendUnconfirmed = false;
    this.isPrivate = false;
    this.selTransType = '0';
    this.transTypeValue = {blocks: '', fees: ''};
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
    if (!this.showAdvanced) {
      this.spendUnconfirmed = false;
      this.selTransType = '0';
      this.transTypeValue = {blocks: '', fees: ''};
    }
  }  

  addNewPeer() {
    console.warn('ADD NEW PEER' + this.selectedPeer);
  } 

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
