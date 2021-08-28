import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, ScreenSizeEnum, UI_MESSAGES } from '../../shared/services/consts-enums-functions';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import * as CLActions from '../store/cl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-lookups',
  templateUrl: './lookups.component.html',
  styleUrls: ['./lookups.component.scss']
})
export class CLLookupsComponent implements OnInit, OnDestroy {

  @ViewChild('form', { static: true }) form: any;
  public lookupKey = '';
  public nodeLookupValue = { nodeid: '' };
  public channelLookupValue = [];
  public flgSetLookupValue = false;
  public temp: any;
  public messageObj = [];
  public selectedFieldId = 0;
  public lookupFields = [
    { id: 0, name: 'Node', placeholder: 'Pubkey' },
    { id: 1, name: 'Channel', placeholder: 'Short Channel ID' }
  ];
  public flgLoading: Array<Boolean | 'error'> = [true];
  public faSearch = faSearch;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.actions.
      pipe(
        takeUntil(this.unSubs[0]),
        filter((action) => (action.type === CLActions.SET_LOOKUP_CL || action.type === CLActions.UPDATE_API_CALL_STATUS_CL))
      ).subscribe((resLookup: CLActions.SetLookup | CLActions.UpdateAPICallStatus) => {
        if (resLookup.type === CLActions.SET_LOOKUP_CL) {
          this.flgLoading[0] = true;
          switch (this.selectedFieldId) {
            case 0:
              this.nodeLookupValue = resLookup.payload[0] ? JSON.parse(JSON.stringify(resLookup.payload[0])) : { nodeid: '' };
              break;
            case 1:
              this.channelLookupValue = resLookup.payload ? JSON.parse(JSON.stringify(resLookup.payload)) : [];
              break;
            default:
              break;
          }
          this.flgSetLookupValue = true;
          this.logger.info(this.nodeLookupValue);
          this.logger.info(this.channelLookupValue);
        }
        if (resLookup.type === CLActions.UPDATE_API_CALL_STATUS_CL && resLookup.payload.status === APICallStatusEnum.ERROR && resLookup.payload.action === 'Lookup') {
          this.flgLoading[0] = 'error';
        }
      });
  }

  onLookup(): boolean|void {
    if (!this.lookupKey) {
      return true;
    }
    this.flgSetLookupValue = false;
    this.nodeLookupValue = { nodeid: '' };
    this.channelLookupValue = [];
    switch (this.selectedFieldId) {
      case 0:
        this.store.dispatch(new CLActions.PeerLookup(this.lookupKey.trim()));
        break;
      case 1:
        this.store.dispatch(new CLActions.ChannelLookup({ uiMessage: UI_MESSAGES.SEARCHING_CHANNEL, shortChannelID: this.lookupKey.trim(), showError: false }));
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
    this.nodeLookupValue = { nodeid: '' };
    this.channelLookupValue = [];
    this.form.resetForm();
  }

  clearLookupValue() {
    this.nodeLookupValue = { nodeid: '' };
    this.channelLookupValue = [];
    this.flgSetLookupValue = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}
