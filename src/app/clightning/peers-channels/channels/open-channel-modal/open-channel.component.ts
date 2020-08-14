import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Peer, GetInfo, Transaction } from '../../../../shared/models/clModels';
import { CLOpenChannelAlert } from '../../../../shared/models/alertData';
import { FEE_RATE_TYPES } from '../../../../shared/services/consts-enums-functions';

import * as CLActions from '../../../store/cl.actions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class CLOpenChannelComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: false }) form: any;
  public selectedPeer = new FormControl();
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: Peer;
  public peers: Peer[];
  public sortedPeers: Peer[];
  public filteredPeers: Observable<Peer[]>;
  public transactions: Transaction[] = [];
  public selUTXOs = [];
  public totalSelectedUTXOAmount = 0;
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public selectedPubkey = '';
  public isPrivate = false;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFeeRate = '';
  public flgMinConf = false;
  public minConfValue = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private decimalPipe: DecimalPipe) {}

  ngOnInit() {
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.transactions = this.data.message.transactions;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers && this.data.message.peers.length ? this.data.message.peers : [];
    this.actions$.pipe(takeUntil(this.unSubs[0]),
    filter(action => action.type === CLActions.EFFECT_ERROR_CL || action.type === CLActions.FETCH_CHANNELS_CL))
    .subscribe((action: CLActions.EffectError | CLActions.FetchChannels) => {
      if (action.type === CLActions.EFFECT_ERROR_CL && action.payload.action === 'SaveNewChannel') {
        this.channelConnectionError = action.payload.message;
      }
      if (action.type === CLActions.FETCH_CHANNELS_CL) {
        this.dialogRef.close();
      }
    });
    let x = '', y = '';
    this.sortedPeers = this.peers.sort((p1, p2) => {
      x = p1.alias ? p1.alias.toLowerCase() : p1.id ? p1.id.toLowerCase() : '';
      y = p2.alias ? p2.alias.toLowerCase() : p1.id.toLowerCase();
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.filteredPeers = this.selectedPeer.valueChanges.pipe(takeUntil(this.unSubs[1]), startWith(''),
      map(peer => typeof peer === 'string' ? peer : peer.alias ? peer.alias : peer.id),
      map(alias => alias ? this.filterPeers(alias) : this.sortedPeers.slice())
    );
  }

  private filterPeers(newlySelectedPeer: string): Peer[] {
    return this.sortedPeers.filter(peer => peer.alias.toLowerCase().indexOf(newlySelectedPeer ? newlySelectedPeer.toLowerCase() : '') === 0);
  }

  displayFn(peer: Peer): string {
    return (peer && peer.alias) ? peer.alias : (peer && peer.id) ? peer.id : '';
  }

  onSelectedPeerChanged() {
    this.channelConnectionError = '';
    this.selectedPubkey = (this.selectedPeer.value && this.selectedPeer.value.id) ? this.selectedPeer.value.id : undefined;
    if (typeof this.selectedPeer.value === 'string') {
      let selPeer = this.peers.filter(peer => peer.alias.length === this.selectedPeer.value.length && peer.alias.toLowerCase().indexOf(this.selectedPeer.value ? this.selectedPeer.value.toLowerCase() : '') === 0);
      if (selPeer.length === 1 && selPeer[0].id) { this.selectedPubkey = selPeer[0].id; }
    }
    if (this.selectedPeer.value && !this.selectedPubkey) {
      this.selectedPeer.setErrors({notfound: true});
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
      this.advancedTitle = (!this.flgMinConf && !this.selFeeRate) ? 'Advanced Options' : 'Advanced Options | ' + (this.flgMinConf ? 'Min Confirmation Blocks: ' : 'Fee Rate: ') + (this.flgMinConf ? this.minConfValue : (this.selFeeRate ? this.feeRateTypes.find(feeRateType => feeRateType.feeRateId === this.selFeeRate).feeRateType : '') + ((this.selUTXOs.length && this.selUTXOs.length > 0) ? ' | Selected UTXOs: ' + this.selUTXOs.length + ' | Total Amount: ' + this.decimalPipe.transform(this.totalSelectedUTXOAmount) + ' Sats' : ''));
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  onUTXOSelectionChange(event: any) {
    let utxoNew = {value: 0}; 
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      this.totalSelectedUTXOAmount = this.selUTXOs.reduce((a, b) => {utxoNew.value = a.value + b.value; return utxoNew;}).value;
    } else {
      this.totalSelectedUTXOAmount = 0;
    }
  }

  onOpenChannel() {
    if ((!this.peer && !this.selectedPubkey) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || (this.flgMinConf && !this.minConfValue))) { return true; }
    let newChannel = { peerId: ((!this.peer || !this.peer.id) ? this.selectedPubkey : this.peer.id), satoshis: this.fundingAmount, announce: !this.isPrivate, feeRate: this.selFeeRate, minconf: this.flgMinConf ? this.minConfValue : null };
    if (this.selUTXOs.length && this.selUTXOs.length > 0) {
      newChannel['utxos'] = [];
      this.selUTXOs.forEach(utxo => newChannel['utxos'].push(utxo.txid + ':' + utxo.output));
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new CLActions.SaveNewChannel(newChannel));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
