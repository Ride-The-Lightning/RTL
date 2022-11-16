import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Observable } from 'rxjs';
import { takeUntil, filter, startWith, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Peer, GetInfo, SaveChannel } from '../../../../shared/models/eclModels';
import { APICallStatusEnum, ECLActions } from '../../../../shared/services/consts-enums-functions';
import { ECLOpenChannelAlert } from '../../../../shared/models/alertData';

import { RTLState } from '../../../../store/rtl.state';
import { saveNewChannel } from '../../../store/ecl.actions';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { eclNodeSettings } from '../../../store/ecl.selector';

@Component({
  selector: 'rtl-ecl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class ECLOpenChannelComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public selNode: SelNodeChild | null = {};
  public selectedPeer = new FormControl();
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: Peer | null;
  public peers: Peer[];
  public sortedPeers: Peer[];
  public filteredPeers: Observable<Peer[]>;
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number | null;
  public selectedPubkey = '';
  public isPrivate = false;
  public feeRate: number | null = null;
  public selChannelType: any = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLOpenChannelAlert, private store: Store<RTLState>, private actions: Actions) { }

  ngOnInit() {
    if (this.data.message) {
      this.information = this.data.message.information;
      this.totalBalance = this.data.message.balance;
      this.peer = this.data.message.peer || null;
      this.peers = this.data.message.peers || [];
    } else {
      this.information = {};
      this.totalBalance = 0;
      this.peer = null;
      this.peers = [];
    }
    this.alertTitle = this.data.alertTitle || 'Alert';
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: SelNodeChild | null) => {
        this.selNode = nodeSettings;
        this.isPrivate = !!nodeSettings?.unannouncedChannels;
      });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL || action.type === ECLActions.FETCH_CHANNELS_ECL)).
      subscribe((action: any) => {
        if (action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
        if (action.type === ECLActions.FETCH_CHANNELS_ECL) {
          this.dialogRef.close();
        }
      });
    let x = '';
    let y = '';
    this.sortedPeers = this.peers.sort((p1, p2) => {
      x = p1.alias ? p1.alias.toLowerCase() : p1.nodeId ? p1.nodeId.toLowerCase() : '';
      y = p2.alias ? p2.alias.toLowerCase() : p1.nodeId ? p1.nodeId.toLowerCase() : '';
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    this.filteredPeers = this.selectedPeer.valueChanges.pipe(
      takeUntil(this.unSubs[2]), startWith(''),
      map((peer) => (typeof peer === 'string' ? peer : peer.alias ? peer.alias : peer.nodeId)),
      map((alias) => (alias ? this.filterPeers(alias) : this.sortedPeers.slice()))
    );
  }

  private filterPeers(newlySelectedPeer: string): Peer[] {
    return this.sortedPeers?.filter((peer) => peer.alias?.toLowerCase().indexOf(newlySelectedPeer ? newlySelectedPeer.toLowerCase() : '') === 0);
  }

  displayFn(peer: Peer): string {
    return (peer && peer.alias) ? peer.alias : (peer && peer.nodeId) ? peer.nodeId : '';
  }

  onSelectedPeerChanged() {
    this.channelConnectionError = '';
    this.selectedPubkey = (this.selectedPeer.value && this.selectedPeer.value.nodeId) ? this.selectedPeer.value.nodeId : null;
    if (typeof this.selectedPeer.value === 'string') {
      const selPeer = this.peers?.filter((peer) => peer.alias?.length === this.selectedPeer.value.length && peer.alias?.toLowerCase().indexOf(this.selectedPeer.value ? this.selectedPeer.value.toLowerCase() : '') === 0);
      if (selPeer.length === 1 && selPeer[0].nodeId) {
        this.selectedPubkey = selPeer[0].nodeId;
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
    this.feeRate = null;
    this.selectedPeer.setValue('');
    this.fundingAmount = null;
    this.isPrivate = !!this.selNode?.unannouncedChannels;
    this.channelConnectionError = '';
    this.selChannelType = null;
    this.advancedTitle = 'Advanced Options';
    this.form.resetForm();
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    this.advancedTitle = 'Advanced Options';
    if (isClosed) {
      if (this.feeRate && this.feeRate > 0) {
        this.advancedTitle = this.advancedTitle + ' | Fee (Sats/vByte): ' + this.feeRate;
      }
      if (this.selChannelType && this.selChannelType.id && this.selChannelType.id !== '') {
        this.advancedTitle = this.advancedTitle + ' | Channel Type: ' + this.selChannelType.placeholder;
      }
    }
  }

  onOpenChannel(): boolean | void {
    if ((!this.peer && !this.selectedPubkey) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0))) {
      return true;
    }
    const saveChannelPayload: SaveChannel = { nodeId: ((!this.peer || !this.peer.nodeId) ? this.selectedPubkey : this.peer.nodeId), amount: this.fundingAmount, private: this.isPrivate, channelType: 'anchor_outputs_zero_fee_htlc_tx' };
    if (this.feeRate) { saveChannelPayload['feeRate'] = this.feeRate; }
    this.store.dispatch(saveNewChannel({ payload: saveChannelPayload }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
