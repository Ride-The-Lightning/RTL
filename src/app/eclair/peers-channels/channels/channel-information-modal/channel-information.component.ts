import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { ECLChannelInformation } from '../../../../shared/models/alertData';
import { Channel } from '../../../../shared/models/eclModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-ecl-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class ECLChannelInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public channel: Channel;
  public channelsType = 'open';
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<ECLChannelInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: ECLChannelInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.channelsType = this.data.channelsType;
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
