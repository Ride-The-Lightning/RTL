import { Component, OnInit, OnDestroy, Inject, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { faCopy, faInfoCircle, faExclamationTriangle, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';

import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { Node } from '../../../../shared/models/RTLconfig';
import { RecommendedFeeRates, BlockExplorerTransaction } from '../../../../shared/models/rtlModels';
import { BumpFeeInformation } from '../../../../shared/models/alertData';
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
  @ViewChild('outputIdx') set outputIndx(outIdx: NgModel) {
    if (outIdx) {
      this.outputIdx = outIdx;
    }
  }
  public faUpRightFromSquare = faUpRightFromSquare;
  public txid: string = '';
  public outputIndex: number | null = null;
  public transTypes = [...TRANS_TYPES];
  public selTransType = '2';
  public blocks: number | null = null;
  public fees: number | null = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  public flgShowDustWarning = false;
  public dustOutputValue = 0;
  public recommendedFee: RecommendedFeeRates = { fastestFee: 0, halfHourFee: 0, hourFee: 0 };
  public selNode: Node;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<BumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: BumpFeeInformation, private logger: LoggerService, private dataService: DataService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.transTypes = this.transTypes.splice(1);
    if (this.data.pendingChannel && this.data.pendingChannel.channel) {
      const channelPointArr = this.data.pendingChannel.channel?.channel_point?.split(':') || [];
      this.txid = channelPointArr[0] || (this.data.pendingChannel.channel && this.data.pendingChannel.channel.channel_point ? this.data.pendingChannel.channel.channel_point : '');
      this.outputIndex = channelPointArr[1] && channelPointArr[1] !== '' && +channelPointArr[1] === 0 ? 1 : 0;
    } else if (this.data.selUTXO && this.data.selUTXO.outpoint) {
      this.txid = this.data.selUTXO.outpoint.txid_str || '';
      this.outputIndex = this.data.selUTXO.outpoint.output_index || 0;
    }
    this.logger.info(this.txid, this.outputIndex);
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).
      subscribe((selNode) => {
        this.selNode = selNode;
        this.logger.info(this.selNode);
      });
    this.dataService.getRecommendedFeeRates().pipe(takeUntil(this.unSubs[1])).subscribe({
      next: (rfRes: RecommendedFeeRates) => {
        this.recommendedFee = rfRes;
      }, error: (err) => {
        this.logger.error(err);
      }
    });
    this.dataService.getBlockExplorerTransaction(this.txid).
      pipe(takeUntil(this.unSubs[2])).subscribe({
        next: (txRes: BlockExplorerTransaction) => {
          this.dustOutputValue = txRes.vout[this.outputIndex].value;
          this.flgShowDustWarning = this.dustOutputValue < 1000;
        }, error: (err) => {
          this.logger.error(err);
        }
      });
  }

  onBumpFee(): boolean | void {
    if (this.data.pendingChannel && this.data.pendingChannel.channel) {
      const channelPointArr = this.data.pendingChannel.channel?.channel_point?.split(':') || [];
      const chanIdx = channelPointArr.length > 1 && channelPointArr[1] && channelPointArr[1] !== '' ? +channelPointArr[1] : null;
      if (chanIdx && this.outputIndex === chanIdx) {
        this.outputIdx.control.setErrors({ pendingChannelOutputIndex: true });
        return true;
      }
    }
    if ((!this.outputIndex && this.outputIndex !== 0) || (this.selTransType === '1' && (!this.blocks || this.blocks === 0)) || (this.selTransType === '2' && (!this.fees || this.fees === 0))) {
      return true;
    }
    this.dataService.bumpFee(this.txid, this.outputIndex, (this.blocks || null), (this.fees || null)).pipe(takeUntil(this.unSubs[3])).
      subscribe({
        next: (res) => {
          this.dialogRef.close(false);
        }, error: (err) => {
          this.logger.error(err);
          this.bumpFeeError = err.message ? err.message : err;
        }
      });
  }

  onExplorerClicked() {
    window.open(this.selNode.settings.blockExplorerUrl + '/tx/' + this.txid, '_blank');
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
