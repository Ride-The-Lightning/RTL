import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { CommonService } from '../../../services/common.service';
import { ShowPubkeyData } from '../../../models/alertData';
import { GetInfoRoot } from '../../../models/RTLconfig';
import { ScreenSizeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-show-pubkey',
  templateUrl: './show-pubkey.component.html',
  styleUrls: ['./show-pubkey.component.scss']
})
export class ShowPubkeyComponent implements OnInit {
  public faReceipt = faReceipt;
  public information: GetInfoRoot;
  public infoTypes = [{infoID: 0, infoKey: 'node pubkey', infoName: 'Node pubkey'}, { infoID: 1, infoKey: 'node URI', infoName: 'Node URI'}];
  public selInfoType = this.infoTypes[0];
  public qrWidth = 210;
  public screenSize = '';
  
  constructor(public dialogRef: MatDialogRef<ShowPubkeyComponent>, @Inject(MAT_DIALOG_DATA) public data: ShowPubkeyData, private logger: LoggerService, private snackBar: MatSnackBar, private commonService: CommonService) { }

  ngOnInit() {
    this.information = this.data.information;
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 90;
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.qrWidth = 160;
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.qrWidth = 200;
    }

  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyPubkey(payload: string) {
    this.snackBar.open(this.selInfoType.infoName + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
