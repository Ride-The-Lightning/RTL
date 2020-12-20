import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Peer, GetInfo } from '../../../../shared/models/eclModels';
import { ECLOpenChannelAlert } from '../../../../shared/models/alertData';

import * as ECLActions from '../../../store/ecl.actions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class ECLOpenChannelComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;
  public selectedPeer = new FormControl();
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: Peer;
  public peers: Peer[];
  public sortedPeers: Peer[];
  public filteredPeers: Observable<Peer[]>;
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public selectedPubkey = '';
  public isPrivate = false;
  public feeRate = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLOpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers && this.data.message.peers.length ? this.data.message.peers : [];
    this.actions$.pipe(takeUntil(this.unSubs[0]),
    filter(action => action.type === ECLActions.EFFECT_ERROR_ECL || action.type === ECLActions.FETCH_CHANNELS_ECL))
    .subscribe((action: ECLActions.EffectError | ECLActions.FetchChannels) => {
      if (action.type === ECLActions.EFFECT_ERROR_ECL && action.payload.action === 'SaveNewChannel') {
        this.channelConnectionError = action.payload.message;
      }
      if (action.type === ECLActions.FETCH_CHANNELS_ECL) {
        this.dialogRef.close();
      }
    });
    let x = '', y = '';
    this.sortedPeers = this.peers.sort((p1, p2) => {
      x = p1.alias ? p1.alias.toLowerCase() : p1.nodeId ? p1.nodeId.toLowerCase() : '';
      y = p2.alias ? p2.alias.toLowerCase() : p1.nodeId.toLowerCase();
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.filteredPeers = this.selectedPeer.valueChanges.pipe(takeUntil(this.unSubs[1]), startWith(''),
      map(peer => typeof peer === 'string' ? peer : peer.alias ? peer.alias : peer.nodeId),
      map(alias => alias ? this.filterPeers(alias) : this.sortedPeers.slice())
    );
  }

  private filterPeers(newlySelectedPeer: string): Peer[] {
    return this.sortedPeers.filter(peer => peer.alias.toLowerCase().indexOf(newlySelectedPeer ? newlySelectedPeer.toLowerCase() : '') === 0);
  }

  displayFn(peer: Peer): string {
    return (peer && peer.alias) ? peer.alias : (peer && peer.nodeId) ? peer.nodeId : '';
  }

  onSelectedPeerChanged() {
    this.channelConnectionError = '';
    this.selectedPubkey = (this.selectedPeer.value && this.selectedPeer.value.nodeId) ? this.selectedPeer.value.nodeId : undefined;
    if (typeof this.selectedPeer.value === 'string') {
      let selPeer = this.peers.filter(peer => peer.alias.length === this.selectedPeer.value.length && peer.alias.toLowerCase().indexOf(this.selectedPeer.value ? this.selectedPeer.value.toLowerCase() : '') === 0);
      if (selPeer.length === 1 && selPeer[0].nodeId) { this.selectedPubkey = selPeer[0].nodeId; }
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
    this.feeRate = null;
    this.selectedPeer.setValue('');
    this.fundingAmount = null;
    this.isPrivate = false;
    this.channelConnectionError = '';
    this.advancedTitle = 'Advanced Options';
    this.form.resetForm(); 
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = (this.feeRate && this.feeRate > 0) ? 'Advanced Options | Fee (Sats/Byte): ' + this.feeRate : 'Advanced Options';
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  onOpenChannel():boolean|void {
    if ((!this.peer && !this.selectedPubkey) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0))) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new ECLActions.SaveNewChannel({
      nodeId: ((!this.peer || !this.peer.nodeId) ? this.selectedPubkey : this.peer.nodeId), amount: this.fundingAmount, private: this.isPrivate, feeRate: this.feeRate
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
