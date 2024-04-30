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
import { Node } from '../../../../shared/models/RTLconfig';
import { GetInfo } from '../../../../shared/models/clnModels';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLState } from '../../../../store/rtl.state';
import { rootSelectedNode } from '../../../../store/rtl.selector';
import { saveNewOffer } from '../../../store/cln.actions';
import { clnNodeInformation } from '../../../store/cln.selector';

@Component({
  selector: 'rtl-cln-create-offer',
  templateUrl: './create-offer.component.html',
  styleUrls: ['./create-offer.component.scss']
})
export class CLNCreateOfferComponent implements OnInit, OnDestroy {

  public faExclamationTriangle = faExclamationTriangle;
  public selNode: Node | null;
  public description = '';
  public offerValue: number | null;
  public issuer = '';
  public offerValueHint = '';
  public information: GetInfo = {};
  public pageSize = PAGE_SIZE;
  public offerError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLNCreateOfferComponent>, @Inject(MAT_DIALOG_DATA) public data: CLNOfferInformation, private store: Store<RTLState>, private decimalPipe: DecimalPipe, private commonService: CommonService, private actions: Actions) { }

  ngOnInit() {
    this.pageSize = this.data.pageSize;
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: Node | null) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clnNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.information = nodeInfo;
      this.issuer = this.information.alias!;
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
    const offerAmt = !this.offerValue ? 'any' : (this.offerValue * 1000).toString();
    this.store.dispatch(saveNewOffer({ payload: { amount: offerAmt, description: this.description, issuer: this.issuer } }));
  }

  resetData() {
    this.description = '';
    this.issuer = this.information.alias!;
    this.offerValue = null;
    this.offerValueHint = '';
    this.offerError = '';
  }

  onOfferValueChange() {
    if (this.selNode && this.selNode.settings.fiatConversion && this.offerValue && this.offerValue > 99) {
      this.offerValueHint = '';
      this.commonService.convertCurrency(this.offerValue, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
        pipe(takeUntil(this.unSubs[3])).
        subscribe({
          next: (data) => {
            this.offerValueHint = '= ' + this.decimalPipe.transform(data.OTHER, CURRENCY_UNIT_FORMATS.OTHER) + ' ' + data.unit;
          }, error: (err) => {
            this.offerValueHint = 'Conversion Error: ' + err;
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
