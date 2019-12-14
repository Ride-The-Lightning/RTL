import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CommonService } from '../../../services/common.service';
import { LoggerService } from '../../../services/logger.service';
import { OnChainAddressInformation } from '../../../models/alertData';
import { ScreenSizeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-on-chain-generated-address',
  templateUrl: './on-chain-generated-address.component.html',
  styleUrls: ['./on-chain-generated-address.component.scss']
})
export class OnChainGeneratedAddressComponent implements OnInit {
  public faReceipt = faReceipt;
  public address = '';
  public addressType = '';
  public qrWidth = 230;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(public dialogRef: MatDialogRef<OnChainGeneratedAddressComponent>, @Inject(MAT_DIALOG_DATA) public data: OnChainAddressInformation, private logger: LoggerService, private commonService: CommonService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.address = this.data.address;
    this.addressType = this.data.addressType;
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 100;
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.qrWidth = 190;
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.qrWidth = 220;
    }
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyAddress(payload: string) {
    this.snackBar.open('Generated Address copied');
    this.logger.info('Copied Text: ' + payload);
  }
}
