import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { CLNChannelInformation } from '../../../../shared/models/alertData';
import { Node } from '../../../../shared/models/RTLconfig';
import { Channel } from '../../../../shared/models/clnModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-cln-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class CLNChannelInformationComponent implements OnInit {

  public faReceipt = faReceipt;
  public faUpRightFromSquare = faUpRightFromSquare;
  public showAdvanced = false;
  public showCopy = true;
  public showCopyField = null;
  public channel: Channel;
  public selNode: Node;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<CLNChannelInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNChannelInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private router: Router) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.showCopy = !!this.data.showCopy;
    this.selNode = this.data.selNode;
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

  onGoToLink(lookupType: string, lookupValue: string) {
    this.router.navigateByUrl('/cln/graph/lookups', { state: { lookupType: lookupType, lookupValue: lookupValue } });
    this.onClose();
  }

  onExplorerClicked() {
    window.open(this.selNode.settings.blockExplorerUrl + '/tx/' + this.channel.funding_txid, '_blank');
  }

}
