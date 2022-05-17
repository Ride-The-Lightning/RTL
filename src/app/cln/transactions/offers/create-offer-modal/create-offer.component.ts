import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { CLNOfferInformation } from '../../../../shared/models/alertData';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, PAGE_SIZE, APICallStatusEnum, CLNActions } from '../../../../shared/services/consts-enums-functions';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { GetInfo } from '../../../../shared/models/clnModels';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { saveNewOffer } from '../../../store/cln.actions';
import { clnNodeInformation, clnNodeSettings } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-create-offer',
  templateUrl: './create-offer.component.html',
  styleUrls: ['./create-offer.component.scss']
})
export class CLNCreateOfferComponent implements OnInit, OnDestroy {

  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public description = '';
  public offerValue: number;
  public vendor = '';
  public offerValueHint = '';
  public offers: any;
  public information: GetInfo = {};
  public pageSize = PAGE_SIZE;
  public offerError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNCreateOfferComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOfferInformation, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions: Actions) { }

  ngOnInit() {
    this.pageSize = this.data.pageSize;
    this.store.select(clnNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
      this.vendor = this.information.alias;
    });
    this.actions.pipe(
      takeUntil(this.unSubs[2]),
      filter((action) => action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN)).
      subscribe((action: any) => {
        if (action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && action.payload.action === 'SaveNewOffer') {
          if (action.payload.status === APICallStatusEnum.ERROR) {
            this.offerError = action.payload.message;
          }
          if (action.payload.status === APICallStatusEnum.COMPLETED) {
            this.dialogRef.close();
          }
        }
      });
  }

  onAddOffer() {
    this.offerError = '';
    const offerAmt = !this.offerValue ? 'any' : this.offerValue + 'sats';
    this.store.dispatch(saveNewOffer({ payload: { amount: offerAmt, description: this.description, vendor: this.vendor } }));
  }

  resetData() {
    this.description = '';
    this.vendor = this.information.alias;
    this.offerValue = null;
    this.offerValueHint = '';
    this.offerError = '';
  }

  onOfferValueChange() {
    if (this.selNode.fiatConversion && this.offerValue > 99) {
      this.offerValueHint = '';
      this.commonService.convertCurrency(this.offerValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
        pipe(takeUntil(this.unSubs[3])).
        subscribe({
          next: (data) => {
            this.offerValueHint = '= ' + data.symbol + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.offerValueHint = 'Conversion Error: ' + err;
          }
        });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
