import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { RecommendedFeeRates, BlockExplorerTransaction } from '../../../../shared/models/rtlModels';
import { PendingOpenChannel } from '../../../../shared/models/lndModels';
import { PendingOpenChannelInformation } from '../../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';
import { DataService } from '../../../../shared/services/data.service';
import { LoggerService } from '../../../../shared/services/logger.service';

@Component({
  selector: 'rtl-bump-fee',
  templateUrl: './bump-fee.component.html',
  styleUrls: ['./bump-fee.component.scss']
})
export class BumpFeeComponent implements OnInit, OnDestroy {

  private outputIdx: NgModel;
  @ViewChild('outputIdx') set payReq(outIdx: NgModel) {
    if (outIdx) {
      this.outputIdx = outIdx;
    }
  }
  public bumpFeeChannel: PendingOpenChannel;
  public transTypes = [...TRANS_TYPES];
  public selTransType = '2';
  public blocks: number | null = null;
  public fees: number | null = null;
  public outputIndex: number | null = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  public flgShowDustWarning = false;
  public dustOutputValue = 0;
  public recommendedFee: RecommendedFeeRates = { fastestFee: 0, halfHourFee: 0, hourFee: 0 };
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<BumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: PendingOpenChannelInformation, private logger: LoggerService, private dataService: DataService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.transTypes = this.transTypes.splice(1);
    this.bumpFeeChannel = this.data.pendingChannel;
    const channelPointArr = this.bumpFeeChannel.channel?.channel_point?.split(':') || [];
    if (this.bumpFeeChannel && this.bumpFeeChannel.channel) {
      this.bumpFeeChannel.channel.txid_str = channelPointArr[0] || (this.bumpFeeChannel.channel && this.bumpFeeChannel.channel.channel_point ? this.bumpFeeChannel.channel.channel_point : '');
      this.bumpFeeChannel.channel.output_index = channelPointArr[1] && channelPointArr[1] !== '' ? +channelPointArr[1] : null;
      this.outputIndex = this.bumpFeeChannel.channel && this.bumpFeeChannel.channel.output_index !== null && this.bumpFeeChannel.channel.output_index === 0 ? 1 : 0;
    }
    this.dataService.getRecommendedFeeRates().pipe(takeUntil(this.unSubs[0])).subscribe({
      next: (rfRes: RecommendedFeeRates) => {
        this.recommendedFee = rfRes;
      }, error: (err) => {
        this.logger.error(err);
      }
    });
    this.dataService.getBlockExplorerTransaction(this.bumpFeeChannel?.channel?.channel_point).
      pipe(takeUntil(this.unSubs[1])).subscribe({
        next: (txRes: BlockExplorerTransaction) => {
          this.dustOutputValue = txRes.vout[this.outputIndex].value;
          this.flgShowDustWarning = this.dustOutputValue < 1000;
        }, error: (err) => {
          this.logger.error(err);
        }
      });
  }

  onBumpFee(): boolean | void {
    if (this.outputIndex === this.bumpFeeChannel.channel?.output_index) {
      this.outputIdx.control.setErrors({ pendingChannelOutputIndex: true });
      return true;
    }
    if ((!this.outputIndex && this.outputIndex !== 0) || (this.selTransType === '1' && (!this.blocks || this.blocks === 0)) || (this.selTransType === '2' && (!this.fees || this.fees === 0))) {
      return true;
    }
    this.dataService.bumpFee((this.bumpFeeChannel && this.bumpFeeChannel.channel && this.bumpFeeChannel.channel.txid_str ? this.bumpFeeChannel.channel.txid_str : ''), this.outputIndex, (this.blocks || null), (this.fees || null)).pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (res) => {
          this.dialogRef.close(false);
        }, error: (err) => {
          this.logger.error(err);
          this.bumpFeeError = err.message ? err.message : err;
        }
      });
  }

  onCopyID(payload: string) {
    this.snackBar.open('Transaction ID copied.');
  }

  resetData() {
    this.bumpFeeError = '';
    this.selTransType = '2';
    this.blocks = null;
    this.fees = null;
    this.outputIdx.control.setErrors(null);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
