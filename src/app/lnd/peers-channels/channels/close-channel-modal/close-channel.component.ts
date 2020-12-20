import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../../shared/services/logger.service';
import { Channel } from '../../../../shared/models/lndModels';
import { ChannelInformation } from '../../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';

import * as LNDActions from '../../../store/lnd.actions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-close-channel',
  templateUrl: './close-channel.component.html',
  styleUrls: ['./close-channel.component.scss']
})
export class CloseChannelComponent implements OnInit, OnDestroy {
  public channelToClose: Channel;
  public transTypes = TRANS_TYPES;
  public selTransType = '0';
  public blocks = null;
  public fees = null;
  public faExclamationTriangle = faExclamationTriangle;
  public faInfoCircle = faInfoCircle;
  public flgPendingHtlcs = false;
  public errorMsg = 'Please wait for pending HTLCs to settle before attempting channel closure.';  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CloseChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelInformation, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private logger: LoggerService) {}

  ngOnInit() {
    this.channelToClose = this.data.channel;
    this.actions$.pipe(takeUntil(this.unSubs[0]),
    filter(action => action.type === LNDActions.EFFECT_ERROR_LND || action.type === LNDActions.SET_ALL_CHANNELS_LND))
    .subscribe((action: LNDActions.EffectError | LNDActions.SetAllChannels) => {
      if (action.type === LNDActions.SET_ALL_CHANNELS_LND) {
        let filteredChannel = action.payload.find(channel => channel.chan_id === this.data.channel.chan_id);
        if (filteredChannel.pending_htlcs && filteredChannel.pending_htlcs.length && filteredChannel.pending_htlcs.length > 0) {
          this.flgPendingHtlcs = true;
        }
      }    
      if (action.type === LNDActions.EFFECT_ERROR_LND && action.payload.action === 'FetchChannels/all') {
        this.logger.error('Fetching latest channel information failed!\n' + action.payload.message);
      }
    });
  }

  onCloseChannel():boolean|void {
    if ((this.selTransType === '1' && (!this.blocks || this.blocks === 0)) || (this.selTransType === '2' && (!this.fees || this.fees === 0))) { return true; }
    let closeChannelParams: any = { channelPoint: this.channelToClose.channel_point, forcibly: !this.channelToClose.active };
    if (this.blocks) { closeChannelParams.targetConf = this.blocks; }
    if (this.fees) { closeChannelParams.satPerByte = this.fees; }
    this.store.dispatch(new RTLActions.OpenSpinner(this.channelToClose.active ? 'Closing Channel...' : 'Force Closing Channel...'));
    this.store.dispatch(new LNDActions.CloseChannel(closeChannelParams));
    this.dialogRef.close(false);
  }

  resetData() {
    this.selTransType = '0';      
    this.blocks = null;
    this.fees = null;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}
