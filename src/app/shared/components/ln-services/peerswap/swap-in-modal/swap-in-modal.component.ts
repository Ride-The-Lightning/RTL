import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { PSSwapInformation } from '../../../../models/alertData';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, APICallStatusEnum, CLNActions } from '../../../../services/consts-enums-functions';
import { PeerswapPolicy, SwapPeerChannelsFlattened } from '../../../../models/peerswapModels';
import { CommonService } from '../../../../services/common.service';

import { RTLState } from '../../../../../store/rtl.state';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { clnNodeSettings, psPolicy } from '../../../../../cln/store/cln.selector';
import { fetchSwaps, swapIn } from '../../../../../cln/store/cln.actions';
import { Router } from '@angular/router';
import { ApiCallStatusPayload } from 'src/app/shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-swap-in-modal',
  templateUrl: './swap-in-modal.component.html',
  styleUrls: ['./swap-in-modal.component.scss']
})
export class PSSwapInModalComponent implements OnInit, OnDestroy {

  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild | null = {};
  public psPolicy: PeerswapPolicy = { min_swap_amount_msat: 100000000 };
  public sPeer: SwapPeerChannelsFlattened | null = null;
  public swapAmount: number | null;
  public swapAmountHint = '';
  public swapInError = '';
  public flgswapCanceled = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<PSSwapInModalComponent>, @Inject(MAT_DIALOG_DATA) public data: PSSwapInformation, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions: Actions, private router: Router) { }

  ngOnInit() {
    this.sPeer = this.data.swapPeer;
    this.store.select(clnNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild | null) => {
      this.selNode = nodeSettings;
    });
    this.store.select(psPolicy).pipe(takeUntil(this.unSubs[1])).subscribe((policySeletor: { policy: PeerswapPolicy, apiCallStatus: ApiCallStatusPayload }) => {
      this.psPolicy = policySeletor.policy;
    });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.action === 'PeerswapSwapin') {
          if (action.payload.status === APICallStatusEnum.ERROR) {
            this.swapInError = action.payload.message;
            if (this.swapInError.includes('Peerswap-listswaps')) {
              this.flgswapCanceled = true;
            }
          }
          if (action.payload.status === APICallStatusEnum.COMPLETED) {
            this.dialogRef.close();
          }
        }
      });
  }

  goToSwapCanceled() {
    this.store.dispatch(fetchSwaps());
    this.router.navigate(['./services/peerswap/pscanceled']);
    this.dialogRef.close();
  }

  onExecuteSwapin(): boolean | void {
    this.swapInError = '';
    this.flgswapCanceled = false;
    if (!this.swapAmount || !this.sPeer || !this.sPeer.short_channel_id) { return true; }
    this.store.dispatch(swapIn({ payload: { alias: this.sPeer.alias || '', amountSats: this.swapAmount, shortChannelId: this.sPeer?.short_channel_id, asset: 'btc' } }));
  }

  resetData() {
    this.swapAmount = null;
    this.swapAmountHint = '';
    this.swapInError = '';
    this.flgswapCanceled = false;
  }

  onAmountChange() {
    if (this.selNode && this.selNode.fiatConversion && this.swapAmount && this.swapAmount > 99) {
      this.swapAmountHint = '';
      this.commonService.convertCurrency(this.swapAmount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.currencyUnits && this.selNode.currencyUnits.length > 2 ? this.selNode.currencyUnits[2] : ''), this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[3])).
        subscribe({
          next: (data) => {
            this.swapAmountHint = '= ' + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.symbol;
          }, error: (err) => {
            this.swapAmountHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
