import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, LNDActions, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { invoiceLookup, paymentLookup } from '../../store/lnd.actions';

@Component({
  selector: 'rtl-lookup-transactions',
  templateUrl: './lookup-transactions.component.html',
  styleUrls: ['./lookup-transactions.component.scss']
})
export class LookupTransactionsComponent implements OnInit, OnDestroy {

  public lookupKey = '';
  public lookupValue = {};
  public flgSetLookupValue = false;
  public temp: any;
  public messageObj = [];
  public selectedFieldId = 0;
  public lookupFields = [
    { id: 0, name: 'Payment', placeholder: 'Payment Hash' },
    { id: 1, name: 'Invoice', placeholder: 'Payment Hash' }
  ];
  public faSearch = faSearch;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.actions.pipe(takeUntil(this.unSubs[0]), filter((action) => (action.type === LNDActions.SET_LOOKUP_LND))).
      subscribe((resLookup: any) => {
        this.flgSetLookupValue = !resLookup.payload.error;
        this.lookupValue = JSON.parse(JSON.stringify(resLookup.payload));
        this.errorMessage = resLookup.payload.error ? this.commonService.extractErrorMessage(resLookup.payload.error) : '';
        this.logger.info(this.lookupValue);
      });
  }

  onLookup(): boolean | void {
    if (!this.lookupKey) {
      return true;
    }
    this.errorMessage = '';
    this.flgSetLookupValue = false;
    this.lookupValue = {};
    switch (this.selectedFieldId) {
      case 0:
        this.store.dispatch(paymentLookup({ payload: Buffer.from(this.lookupKey.trim(), 'hex').toString('base64').replace(/\+/g, '-').replace(/[/]/g, '_') }));
        break;
      case 1:
        this.store.dispatch(invoiceLookup({ payload: { openSnackBar: false, paymentHash: Buffer.from(this.lookupKey.trim(), 'hex').toString('base64').replace(/\+/g, '-').replace(/[/]/g, '_') } }));
        // if (this.lookupKey.trim().length < 45) {
        //   this.store.dispatch(invoiceLookup({ payload: { openSnackBar: false, paymentAddress: this.lookupKey.trim().replace(/\+/g, '-').replace(/[/]/g, '_') } }));
        // }
        // if (this.lookupKey.trim().length > 45 && this.lookupKey.trim().length < 70) {
        //   this.store.dispatch(invoiceLookup({ payload: { openSnackBar: false, paymentHash: Buffer.from(this.lookupKey.trim(), 'hex').toString('base64').replace(/\+/g, '-').replace(/[/]/g, '_') } }));
        // }
        break;
      default:
        break;
    }
  }

  onSelectChange(event: any) {
    this.resetData();
    this.selectedFieldId = event.value;
  }

  resetData() {
    this.flgSetLookupValue = false;
    this.selectedFieldId = 0;
    this.lookupKey = '';
    this.lookupValue = {};
    this.errorMessage = '';
  }

  clearLookupValue() {
    this.lookupValue = {};
    this.flgSetLookupValue = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
