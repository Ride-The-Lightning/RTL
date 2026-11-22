import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { Subject, EMPTY, defer, merge } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faCopy, faInfoCircle, faExclamationTriangle, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { RecommendedFeeRates, BlockExplorerTransaction } from '../../../../shared/models/rtlModels';
import { Channel } from '../../../../shared/models/clnModels';
import { CLNChannelInformation } from '../../../../shared/models/alertData';
import { ADDRESS_TYPES, APICallStatusEnum, CLNActions, getCLNFeeRatePerKb } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { DataService } from '../../../../shared/services/data.service';

import { Node } from '../../../../shared/models/RTLconfig';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { RTLState } from '../../../../store/rtl.state';
import { openSnackBar } from '../../../../store/rtl.actions';
import { setChannelTransaction } from '../../../store/cln.actions';

@Component({
  standalone: false,
  selector: 'rtl-cln-bump-fee',
  templateUrl: './bump-fee.component.html',
  styleUrls: ['./bump-fee.component.scss']
})
export class CLNBumpFeeComponent implements OnInit, OnDestroy {

  private outputIdx: NgModel;
  @ViewChild('outputIdx') set outputIndx(outIdx: NgModel) {
    if (outIdx) {
      this.outputIdx = outIdx;
    }
  }
  public faUpRightFromSquare = faUpRightFromSquare;
  public newAddress = '';
  public bumpFeeChannel: Channel;
  public fees = null;
  public outputIndex = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  public flgShowDustWarning = false;
  public dustOutputValue = 0;
  public recommendedFee: RecommendedFeeRates = { fastestFee: 0, halfHourFee: 0, hourFee: 0 };
  public selNode: Node;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private actions: Actions, public dialogRef: MatDialogRef<CLNBumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNChannelInformation, private store: Store<RTLState>, private logger: LoggerService, private dataService: DataService) { }

  ngOnInit() {
    this.bumpFeeChannel = this.data.channel;
    this.logger.info(this.bumpFeeChannel);
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
    this.dataService.getBlockExplorerTransaction(this.bumpFeeChannel.funding_txid).
      pipe(takeUntil(this.unSubs[2])).subscribe({
        next: (txRes: BlockExplorerTransaction) => {
          this.outputIndex = txRes.vout.findIndex((vout) => vout.value === this.bumpFeeChannel.to_us_msat) === 0 ? 1 : 0;
          this.dustOutputValue = txRes.vout[this.outputIndex].value;
          this.flgShowDustWarning = this.dustOutputValue < 1000;
        }, error: (err) => {
          this.logger.error(err);
        }
      });
  }

  onBumpFee(): boolean | void {
    if ((!this.outputIndex && this.outputIndex !== 0) || !this.fees) {
      return true;
    }
    this.bumpFeeError = '';
    // Spend only to the address this request returns, then wait for that spend's own result.
    this.dataService.getNewAddress(ADDRESS_TYPES[0]).pipe(
      switchMap((newAddress: string) => merge(
        this.actions.pipe(filter((action: any) => action.type === CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN ||
          (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.action === 'SetChannelTransaction' && action.payload.status === APICallStatusEnum.ERROR))),
        defer(() => {
          this.store.dispatch(setChannelTransaction({
            payload: {
              destination: newAddress,
              satoshi: 'all',
              feerate: getCLNFeeRatePerKb(this.fees || 0),
              utxos: [this.bumpFeeChannel.funding_txid + ':' + this.outputIndex]
            }
          }));
          return EMPTY;
        })
      )),
      take(1),
      takeUntil(this.unSubs[3])
    ).subscribe({
      next: (action: any) => {
        if (action.type === CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN) {
          this.store.dispatch(openSnackBar({ payload: 'Successfully bumped the fee. Use the block explorer to verify transaction.' }));
          this.dialogRef.close();
        } else {
          this.logger.error(action.payload.message);
          this.bumpFeeError = action.payload.message;
        }
      }, error: (err) => {
        this.logger.error(err);
        this.bumpFeeError = err.message;
      }
    });
  }

  onExplorerClicked(txid: string) {
    window.open(this.selNode.settings.blockExplorerUrl + '/tx/' + txid, '_blank', 'noopener,noreferrer');
  }

  resetData() {
    this.bumpFeeError = '';
    this.fees = null;
    this.outputIndex = null;
    this.flgShowDustWarning = false;
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
