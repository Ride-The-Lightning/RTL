import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { AlertData } from '../../../models/alertData';

@Component({
  selector: 'rtl-on-chain-generated-address',
  templateUrl: './on-chain-generated-address.component.html',
  styleUrls: ['./on-chain-generated-address.component.scss']
})
export class OnChainGeneratedAddressComponent implements OnInit {
  public faReceipt = faReceipt;
  public address: {address: '', addressType: ''};

  constructor(public dialogRef: MatDialogRef<OnChainGeneratedAddressComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.address = JSON.parse(this.data.message);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyAddress(payload: string) {
    this.snackBar.open('Generated Address copied');
    this.logger.info('Copied Text: ' + payload);
  }
}
