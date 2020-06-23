import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { ECLRChannelInformation } from '../../../../shared/models/alertData';
import { Channel } from '../../../../shared/models/eclrModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-eclr-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class ECLRChannelInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public showCopy = true;
  public showCopyField = null;
  public channel: Channel;
  public channelsType = 'open';
  public channelState = '';
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<ECLRChannelInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLRChannelInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.channelsType = this.data.selectedTab;
    this.showCopy = this.data.showCopy;
    this.channelState = this.channel.state.replace(/_/g, ' ');
    this.screenSize = this.commonService.getScreenSize();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }  

  onCopyChanID(payload: string) {
    this.snackBar.open((this.channelsType === 'open') ? ('Short channel ID ' + payload + ' copied.') : 'Channel ID copied.');
    this.logger.info('Copied Text: ' + payload);
  }
}
