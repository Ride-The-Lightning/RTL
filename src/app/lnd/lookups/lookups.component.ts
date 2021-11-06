import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, ScreenSizeEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import * as LNDActions from '../store/lnd.actions';
import { RTLState } from '../../store/rtl.state';

@Component({
  selector: 'rtl-lookups',
  templateUrl: './lookups.component.html',
  styleUrls: ['./lookups.component.scss']
})
export class LookupsComponent implements OnInit, OnDestroy {

  public lookupKey = '';
  public lookupValue = {};
  public flgSetLookupValue = false;
  public temp: any;
  public messageObj = [];
  public selectedFieldId = 0;
  public lookupFields = [
    { id: 0, name: 'Node', placeholder: 'Pubkey' },
    { id: 1, name: 'Channel', placeholder: 'Channel ID' }
  ];
  public faSearch = faSearch;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apisCallStatus: ApiCallsListLND = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.actions.pipe(takeUntil(this.unSubs[0]), filter((action) => (action.type === LNDActions.SET_LOOKUP_LND || action.type === LNDActions.UPDATE_API_CALL_STATUS_LND))).
      subscribe((resLookup: LNDActions.SetLookup | LNDActions.UpdateAPICallStatus) => {
        if (resLookup.type === LNDActions.SET_LOOKUP_LND) {
          this.errorMessage = (this.selectedFieldId === 0 && resLookup.payload.hasOwnProperty('node')) ? '' : (this.selectedFieldId === 1 && resLookup.payload.hasOwnProperty('channel_id')) ? '' : this.errorMessage;
          this.lookupValue = JSON.parse(JSON.stringify(resLookup.payload));
          this.flgSetLookupValue = (this.selectedFieldId === 0 && resLookup.payload.hasOwnProperty('node')) ? true : !!((this.selectedFieldId === 1 && resLookup.payload.hasOwnProperty('channel_id')));
          this.logger.info(this.lookupValue);
        }
        if (resLookup.type === LNDActions.UPDATE_API_CALL_STATUS_LND && resLookup.payload.action === 'Lookup') {
          this.errorMessage = '';
          if (resLookup.payload.status === APICallStatusEnum.ERROR) {
            this.errorMessage = (typeof (resLookup.payload.message) === 'object') ? JSON.stringify(resLookup.payload.message) : resLookup.payload.message;
          }
          if (resLookup.payload.status === APICallStatusEnum.INITIATED) {
            this.errorMessage = UI_MESSAGES.GET_LOOKUP_DETAILS;
          }
        }
      });
  }

  onLookup(): boolean | void {
    if (!this.lookupKey) {
      return true;
    }
    this.flgSetLookupValue = false;
    this.lookupValue = {};
    switch (this.selectedFieldId) {
      case 0:
        this.store.dispatch(new LNDActions.PeerLookup(this.lookupKey.trim()));
        break;
      case 1:
        this.store.dispatch(new LNDActions.ChannelLookup({ uiMessage: UI_MESSAGES.SEARCHING_CHANNEL, channelID: this.lookupKey.trim() }));
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
