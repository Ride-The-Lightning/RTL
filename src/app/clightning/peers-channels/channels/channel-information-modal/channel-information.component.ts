import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { CLChannelInformation } from '../../../../shared/models/alertData';
import { Channel } from '../../../../shared/models/clModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-cl-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class CLChannelInformationComponent implements OnInit {
  public faReceipt = faReceipt;
  public showAdvanced = false;
  public showCopy = true;
  public showCopyField = null;
  public channel: Channel;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<CLChannelInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLChannelInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.showCopy = this.data.showCopy;
    this.screenSize = this.commonService.getScreenSize();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }  

  onCopyChanID(payload: string) {
    this.snackBar.open('Short channel ID ' + payload + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }
}
