import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faUpRightFromSquare, faCopy } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { CLNChannelInformation } from '../../../../shared/models/alertData';
import { Node } from '../../../../shared/models/RTLconfig';
import { Channel } from '../../../../shared/models/clnModels';
import { ScreenSizeEnum, getCLNSweepBlocks, getCLNCloseTxid } from '../../../../shared/services/consts-enums-functions';

@Component({
  standalone: false,
  selector: 'rtl-cln-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class CLNChannelInformationComponent implements OnInit {

  public faReceipt = faReceipt;
  public faUpRightFromSquare = faUpRightFromSquare;
  public faCopy = faCopy;
  public showAdvanced = false;
  public showCopy = true;
  public showCopyField = null;
  public channel: Channel;
  public selNode: Node;
  public sweepBlocks: number | null = null;
  public closeTxid: string | null = null;
  public statusMessages: string[] = [];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<CLNChannelInformationComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNChannelInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar, private router: Router) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.showCopy = !!this.data.showCopy;
    this.selNode = this.data.selNode;
    this.screenSize = this.commonService.getScreenSize();
    this.sweepBlocks = getCLNSweepBlocks(this.channel.status);
    this.closeTxid = getCLNCloseTxid(this.channel);
    this.statusMessages = [...(this.channel.status || [])].reverse();
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

  onCopyTxID(payload: string) {
    this.snackBar.open('Transaction ID ' + payload + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  onGoToLink(lookupType: string, lookupValue: string) {
    this.router.navigateByUrl('/cln/graph/lookups', { state: { lookupType: lookupType, lookupValue: lookupValue } });
    this.onClose();
  }

  onExplorerClicked(txid: string) {
    if (!this.selNode?.settings?.blockExplorerUrl) { return; }
    window.open(this.selNode.settings.blockExplorerUrl + '/tx/' + txid, '_blank');
  }

}
