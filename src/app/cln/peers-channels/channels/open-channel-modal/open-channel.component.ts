import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CommonService } from '../../../../shared/services/common.service';
import { Peer, GetInfo, UTXO } from '../../../../shared/models/clnModels';
import { CLNOpenChannelAlert } from '../../../../shared/models/alertData';
import { APICallStatusEnum, CLNActions, FEE_RATE_TYPES, ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

import { RTLState } from '../../../../store/rtl.state';
import { saveNewChannel } from '../../../store/cln.actions';

@Component({
  selector: 'rtl-cln-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class CLNOpenChannelComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public selectedPeer = new FormControl();
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public isCompatibleVersion = false;
  public peer: Peer;
  public peers: Peer[];
  public sortedPeers: Peer[];
  public filteredPeers: Observable<Peer[]>;
  public utxos: UTXO[] = [];
  public selUTXOs = [];
  public flgUseAllBalance = false;
  public totalSelectedUTXOAmount = 0;
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount = null;
  public selectedPubkey = '';
  public isPrivate = false;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFeeRate = '';
  public customFeeRate = null;
  public flgMinConf = false;
  public minConfValue = null;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOpenChannelAlert, private store: Store<RTLState>, private actions: Actions, private decimalPipe: DecimalPipe, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.isCompatibleVersion = this.data.message.isCompatibleVersion;
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.utxos = this.data.message.utxos;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer || null;
    this.peers = this.data.message.peers || [];
    this.actions.pipe(
      takeUntil(this.unSubs[0]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN || action.type === CLNActions.FETCH_CHANNELS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
        if (action.type === CLNActions.FETCH_CHANNELS_CLN) {
          this.dialogRef.close();
        }
      });
    let x = '',
      y = '';
    this.sortedPeers = this.peers.sort((p1, p2) => {
      x = p1.alias ? p1.alias.toLowerCase() : p1.id ? p1.id.toLowerCase() : '';
      y = p2.alias ? p2.alias.toLowerCase() : p1.id.toLowerCase();
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.filteredPeers = this.selectedPeer.valueChanges.pipe(takeUntil(this.unSubs[1]), startWith(''),
      map((peer) => (typeof peer === 'string' ? peer : peer.alias ? peer.alias : peer.id)),
      map((alias) => (alias ? this.filterPeers(alias) : this.sortedPeers.slice()))
    );
  }

  private filterPeers(newlySelectedPeer: string): Peer[] {
    return this.sortedPeers.filter((peer) => peer.alias.toLowerCase().indexOf(newlySelectedPeer ? newlySelectedPeer.toLowerCase() : '') === 0);
  }

  displayFn(peer: Peer): string {
    return (peer && peer.alias) ? peer.alias : (peer && peer.id) ? peer.id : '';
  }

  onSelectedPeerChanged() {
    this.channelConnectionError = '';
    this.selectedPubkey = (this.selectedPeer.value && this.selectedPeer.value.id) ? this.selectedPeer.value.id : null;
    if (typeof this.selectedPeer.value === 'string') {
      const selPeer = this.peers.filter((peer) => peer.alias.length === this.selectedPeer.value.length && peer.alias.toLowerCase().indexOf(this.selectedPeer.value ? this.selectedPeer.value.toLowerCase() : '') === 0);
      if (selPeer.length === 1 && selPeer[0].id) {
        this.selectedPubkey = selPeer[0].id;
      }
    }
    if (this.selectedPeer.value && !this.selectedPubkey) {
      this.selectedPeer.setErrors({ notfound: true });
    } else {
      this.selectedPeer.setErrors(null);
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.flgMinConf = false;
    this.selFeeRate = '';
    this.minConfValue = null;
    this.selectedPeer.setValue('');
    this.fundingAmount = null;
    this.isPrivate = false;
    this.channelConnectionError = '';
    this.advancedTitle = 'Advanced Options';
    this.form.resetForm();
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      if (!this.flgMinConf && !this.selFeeRate && (!this.selUTXOs.length || this.selUTXOs.length === 0)) {
        this.advancedTitle = 'Advanced Options';
      } else {
        this.advancedTitle = 'Advanced Options';
        if (this.flgMinConf) {
          this.advancedTitle = this.advancedTitle + ' | Min Confirmation Blocks: ' + this.minConfValue;
        }
        if (this.selFeeRate) {
          this.advancedTitle = this.advancedTitle + ' | Fee Rate: ' + (this.customFeeRate ? (this.customFeeRate + ' (Sats/vByte)') : (this.feeRateTypes.find((feeRateType) => feeRateType.feeRateId === this.selFeeRate).feeRateType));
        }
        if (this.selUTXOs.length && this.selUTXOs.length > 0) {
          this.advancedTitle = this.advancedTitle + ' | Total Selected: ' + this.selUTXOs.length + ' | Selected UTXOs: ' + this.decimalPipe.transform(this.totalSelectedUTXOAmount) + ' Sats';
        }
      }
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  onUTXOSelectionChange(event: any) {
    const utxoNew = { value: 0 };
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.totalSelectedUTXOAmount = this.selUTXOs.reduce((a, b) => {
        utxoNew.value = a.value + b.value;
        return utxoNew;
      }).value;
      if (this.flgUseAllBalance) {
        this.onUTXOAllBalanceChange();
      }
    } else {
      this.totalSelectedUTXOAmount = 0;
      this.fundingAmount = null;
      this.flgUseAllBalance = false;
    }
  }

  onUTXOAllBalanceChange() {
    if (this.flgUseAllBalance) {
      this.fundingAmount = this.totalSelectedUTXOAmount;
    } else {
      this.fundingAmount = null;
    }
  }

  onOpenChannel(): boolean | void {
    if ((!this.peer && !this.selectedPubkey) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || (this.flgMinConf && !this.minConfValue)) || (this.selFeeRate === 'customperkb' && !this.flgMinConf && !this.customFeeRate)) {
      return true;
    }
    const newChannel = { peerId: ((!this.peer || !this.peer.id) ? this.selectedPubkey : this.peer.id), satoshis: (this.flgUseAllBalance) ? 'all' : this.fundingAmount.toString(), announce: !this.isPrivate, minconf: this.flgMinConf ? this.minConfValue : null };
    newChannel['feeRate'] = (this.selFeeRate === 'customperkb' && !this.flgMinConf && this.customFeeRate) ? (this.customFeeRate * 1000) + 'perkb' : this.selFeeRate;
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      newChannel['utxos'] = [];
      this.selUTXOs.forEach((utxo) => newChannel['utxos'].push(utxo.txid + ':' + utxo.output));
    }
    this.store.dispatch(saveNewChannel({ payload: newChannel }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
