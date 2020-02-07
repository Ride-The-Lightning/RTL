import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import { Channel } from '../../../models/lndModels';
import { ChannelInformation } from '../../../models/alertData';
import { TRANS_TYPES } from '../../../services/consts-enums-functions';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-close-channel-lnd',
  templateUrl: './close-channel-lnd.component.html',
  styleUrls: ['./close-channel-lnd.component.scss']
})
export class CloseChannelLndComponent implements OnInit {
  public channelToClose: Channel;
  public transTypes = TRANS_TYPES;
  public selTransType = '0';
  public blocks = null;
  public fees = null;

  constructor(public dialogRef: MatDialogRef<CloseChannelLndComponent>, @Inject(MAT_DIALOG_DATA) public data: ChannelInformation, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.channelToClose = this.data.channel;
  }

  onCloseChannel() {
    if ((this.selTransType === '1' && (!this.blocks || this.blocks === 0)) || (this.selTransType === '2' && (!this.fees || this.fees === 0))) { return true; }
    let closeChannelParams: any = { channelPoint: this.channelToClose.channel_point, forcibly: !this.channelToClose.active };
    if (this.blocks) { closeChannelParams.targetConf = this.blocks; }
    if (this.fees) { closeChannelParams.satPerByte = this.fees; }
    this.store.dispatch(new RTLActions.OpenSpinner('Closing Channel...'));
    this.store.dispatch(new RTLActions.CloseChannel(closeChannelParams));
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

}
