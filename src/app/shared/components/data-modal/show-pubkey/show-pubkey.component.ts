import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { AlertData } from '../../../models/alertData';

@Component({
  selector: 'rtl-show-pubkey',
  templateUrl: './show-pubkey.component.html',
  styleUrls: ['./show-pubkey.component.scss']
})
export class ShowPubkeyComponent implements OnInit {
  public faReceipt = faReceipt;
  public pubkey: string;

  constructor(public dialogRef: MatDialogRef<ShowPubkeyComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.pubkey = JSON.parse(this.data.message);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyPubkey(payload: string) {
    this.snackBar.open('Pubkey copied');
    this.logger.info('Copied Text: ' + payload);
  }

}
