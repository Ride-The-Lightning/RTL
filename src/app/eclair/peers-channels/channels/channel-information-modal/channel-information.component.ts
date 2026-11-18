import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faReceipt, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { ECLChannelInformation } from '../../../../shared/models/alertData';
import { Channel } from '../../../../shared/models/eclModels';
import { Node } from '../../../../shared/models/RTLconfig';
import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';

@Component({
  standalone: false,
  selector: 'rtl-ecl-channel-information',
  templateUrl: './channel-information.component.html',
  styleUrls: ['./channel-information.component.scss']
})
export class ECLChannelInformationComponent implements OnInit {

  public faReceipt = faReceipt;
  public faUpRightFromSquare = faUpRightFromSquare;
  public selNode: Node | null = null;
  public showAdvanced = false;
  public channel: Channel;
  public channelsType = 'open';
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(
    public dialogRef: MatDialogRef<ECLChannelInformationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ECLChannelInformation,
    private logger: LoggerService,
    private commonService: CommonService,
    private snackBar: MatSnackBar,
    private router: Router,
    private store: Store<RTLState>
  ) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.channelsType = this.data.channelsType || '';
    this.screenSize = this.commonService.getScreenSize();
    this.store.select(rootSelectedNode).pipe(take(1)).subscribe((selNode) => { this.selNode = selNode; });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  onShowAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  onCopyChanID(payload: string) {
    this.snackBar.open((this.channelsType === 'open') ? ('Short channel ID ' + payload + ' copied.') : 'Channel ID copied.');
    this.logger.info('Copied Text: ' + payload);
  }

  onGoToLink(lookupType: string, lookupValue: string) {
    this.router.navigateByUrl('/ecl/graph/lookups', { state: { lookupType: lookupType, lookupValue: lookupValue } });
    this.onClose();
  }

  onExplorerClicked(txid: string) {
    if (!this.selNode?.settings?.blockExplorerUrl) { return; }
    window.open(this.selNode.settings.blockExplorerUrl + '/tx/' + txid, '_blank', 'noopener,noreferrer');
  }

}
