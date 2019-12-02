import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { OnChainAddressInformation } from '../../../models/alertData';

@Component({
  selector: 'rtl-on-chain-generated-address',
  templateUrl: './on-chain-generated-address.component.html',
  styleUrls: ['./on-chain-generated-address.component.scss']
})
export class OnChainGeneratedAddressComponent implements OnInit {
  public faReceipt = faReceipt;
  public address = '';
  public addressType = '';

  constructor(public dialogRef: MatDialogRef<OnChainGeneratedAddressComponent>, @Inject(MAT_DIALOG_DATA) public data: OnChainAddressInformation, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.address = this.data.address;
    this.addressType = this.data.addressType;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyAddress(payload: string) {
    this.snackBar.open('Generated Address copied');
    this.logger.info('Copied Text: ' + payload);
  }
}
