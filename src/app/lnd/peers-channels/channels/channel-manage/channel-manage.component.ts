import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { MatSort, MatSnackBar } from '@angular/material';
import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { TRANS_TYPES, ScreenSizeEnum, AlertTypeEnum, DataTypeEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLEffects } from '../../../../store/rtl.effects';
import { LNDEffects } from '../../../store/lnd.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-manage',
  templateUrl: './channel-manage.component.html',
  styleUrls: ['./channel-manage.component.scss']
})
export class ChannelManageComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('form', {static: true}) form: any;
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
  public peerAddress = '';
  public newlyAddedPeer = '';
  public screenSizeEnum = ScreenSizeEnum;
  public screenSize = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private commonService: CommonService, private actions$: Actions, private snackBar: MatSnackBar) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.information = rtlStore.information;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (!peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });
      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.SET_PEERS || action.type === RTLActions.FETCH_ALL_CHANNELS))
    .subscribe((action: RTLActions.SetPeers | RTLActions.FetchAllChannels) => {
      if(action.type === RTLActions.SET_PEERS) {
        if(this.newlyAddedPeer !== '') {
          this.snackBar.open('Peer added successfully. Proceed to open the channel.');
          this.selectedPeer = this.newlyAddedPeer;
          this.newlyAddedPeer = '';
        }
      }
      if(action.type === RTLActions.FETCH_ALL_CHANNELS) {
        this.form.resetForm();
      }
    });
  }

  onOpenChannel() {
    if (!this.selectedPeer || this.selectedPeer === '' || !this.fundingAmount || (this.totalBalance - ((this.fundingAmount) ? this.fundingAmount : 0) < 0)) { return true; }
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
    this.spendUnconfirmed = false;
    this.isPrivate = false;
    this.selTransType = '0';
    this.transTypeValue = {blocks: '', fees: ''};
    this.form.resetForm();
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
    this.store.dispatch(new RTLActions.OpenConfirmation({ data: {
      type: AlertTypeEnum.CONFIRM,
      alertTitle: 'Add peer',
      message: '',
      noBtnText: 'Do it Later',
      yesBtnText: 'Add Peer',
      flgShowInput: true,
      getInputs: [
        {placeholder: 'Lightning Address (pubkey OR pubkey@ip:port)', inputType: DataTypeEnum.STRING, inputValue: '', width: 100}
      ]
    }}));
    this.rtlEffects.closeConfirm
    .pipe(take(1))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.peerAddress = confirmRes[0].inputValue;
        const pattern = '^([a-zA-Z0-9]){1,66}@(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$';
        const deviderIndex = this.peerAddress.search('@');
        let pubkey = '';
        let host = '';
        if (new RegExp(pattern).test(this.peerAddress)) {
          pubkey = this.peerAddress.substring(0, deviderIndex);
          host = this.peerAddress.substring(deviderIndex + 1);
          this.connectPeerWithParams(pubkey, host);
        } else {
          pubkey = (deviderIndex > -1) ? this.peerAddress.substring(0, deviderIndex) : this.peerAddress;
          this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
          this.store.dispatch(new RTLActions.FetchGraphNode(pubkey));
          this.lndEffects.setGraphNode
          .pipe(take(1))
          .subscribe(graphNode => {
            host = (!graphNode.node.addresses || !graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
            this.connectPeerWithParams(pubkey, host);
          });
        }
      } else {
        this.selectedPeer = '';
      }
    });
  } 

  connectPeerWithParams(pubkey: string, host: string) {
    this.newlyAddedPeer = pubkey;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false, showOpenChannelModal: false}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
