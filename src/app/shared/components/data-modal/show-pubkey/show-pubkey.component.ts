import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { faReceipt } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';

import { LoggerService } from '../../../services/logger.service';
import { ShowPubkeyData } from '../../../models/alertData';
import { GetInfoRoot } from '../../../models/RTLconfig';

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
  
  constructor(public dialogRef: MatDialogRef<ShowPubkeyComponent>, @Inject(MAT_DIALOG_DATA) public data: ShowPubkeyData, private logger: LoggerService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.information = this.data.information;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onCopyPubkey(payload: string) {
    this.snackBar.open(this.selInfoType.infoName + ' copied.');
    this.logger.info('Copied Text: ' + payload);
  }

}
