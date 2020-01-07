import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import { MatSort, MatSnackBar } from '@angular/material';
import { PeerCL, GetInfoCL } from '../../../../shared/models/clModels';
import { ScreenSizeEnum, AlertTypeEnum, DataTypeEnum, FEE_RATE_TYPES } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLEffects } from '../../../../store/rtl.effects';
import { CLEffects } from '../../../store/cl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channel-manage',
  templateUrl: './channel-manage.component.html',
  styleUrls: ['./channel-manage.component.scss']
})
export class CLChannelManageComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public totalBalance = 0;
  public selectedPeer = '';
  public fundingAmount: number;
  public peers: PeerCL[] = [];
  public information: GetInfoCL = {};
  public myChanPolicy: any = {};
  public isPrivate = false;
  public feeRateTypes = FEE_RATE_TYPES;
  public showAdvanced = false;
  public peerAddress = '';
  public newlyAddedPeer = '';
  public selFeeRate = '';
  public flgMinConf = false;
  public minConfValue = null;
  public moreOptions = false;
  public screenSizeEnum = ScreenSizeEnum;
  public screenSize = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: CLEffects, private commonService: CommonService, private actions$: Actions, private snackBar: MatSnackBar) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.information = rtlStore.information;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (undefined === peer.alias || peer.alias === '') {
          peer.alias = peer.id.substring(0, 15) + '...';
        }
      });
      this.totalBalance = rtlStore.balance.totalBalance;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.SET_PEERS_CL))
    .subscribe((action: RTLActions.SetPeersCL) => {
      if(this.newlyAddedPeer !== '') {
        this.snackBar.open('Peer added successfully. Proceed to open the channel.');
        this.selectedPeer = this.newlyAddedPeer;
        this.newlyAddedPeer = '';
      }
    });
  }

  onOpenChannel() {
    if (!this.selectedPeer || this.selectedPeer === '' || !this.fundingAmount || (this.totalBalance - ((this.fundingAmount) ? this.fundingAmount : 0) < 0)) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannelCL({
      peerId: this.selectedPeer, satoshis: this.fundingAmount, announce: !this.isPrivate, feeRate: this.selFeeRate, minconf: this.flgMinConf ? this.minConfValue : null
    }));
  }

  resetData() {
    this.selectedPeer = '';
    this.fundingAmount = 0;
    this.moreOptions = false;
    this.flgMinConf = false;
    this.isPrivate = false;
    this.selFeeRate = '';
    this.minConfValue = null;
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
    if (!this.showAdvanced) {    
      this.flgMinConf = false;
      this.isPrivate = false;
      this.selFeeRate = '';
      this.minConfValue = null;
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
        this.newlyAddedPeer = this.peerAddress;
        this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
        this.store.dispatch(new RTLActions.SaveNewPeerCL({id: this.peerAddress}));
      } else {
        this.selectedPeer = '';
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
