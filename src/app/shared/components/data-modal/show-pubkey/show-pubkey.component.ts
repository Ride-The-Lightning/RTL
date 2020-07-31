import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  public infoTypes = [{infoID: 0, infoKey: 'node pubkey', infoName: 'Node pubkey'}];
  public selInfoType = this.infoTypes[0];
  public qrWidth = 210;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<ShowPubkeyComponent>, @Inject(MAT_DIALOG_DATA) public data: ShowPubkeyData, private logger: LoggerService, private snackBar: MatSnackBar, private commonService: CommonService) { }

  ngOnInit() {
    this.information = this.data.information;
    if (this.information.uris) {
      if (this.information.uris.length === 1) {
        this.infoTypes.push({infoID: 1, infoKey: 'node URI', infoName: 'Node URI'});
      } else if (this.information.uris.length > 1) {
        this.information.uris.forEach((uri, idx) => {
          this.infoTypes.push({infoID: (idx + 1), infoKey: 'node URI ' + (idx + 1), infoName: 'Node URI ' + (idx + 1)});
        });
      }
    }
    this.screenSize = this.commonService.getScreenSize();
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyPubkey(payload: string) {
    this.snackBar.open(this.selInfoType.infoName + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
