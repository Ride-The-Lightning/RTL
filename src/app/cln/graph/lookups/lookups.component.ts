import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { APICallStatusEnum, CLNActions, ScreenSizeEnum, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { channelLookup, peerLookup } from '../../store/cln.actions';

@Component({
  selector: 'rtl-cln-lookups',
  templateUrl: './lookups.component.html',
  styleUrls: ['./lookups.component.scss']
})
export class CLNLookupsComponent implements OnInit, OnDestroy {

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

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private actions: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.actions.
      pipe(
        takeUntil(this.unSubs[0]),
        filter((action) => (action.type === CLNActions.SET_LOOKUP_CLN || action.type === CLNActions.UPDATE_API_CALL_STATUS_CLN))
      ).subscribe((resLookup: any) => {
        if (resLookup.type === CLNActions.SET_LOOKUP_CLN) {
          this.flgLoading[0] = true;
          switch (this.selectedFieldId) {
            case 0:
              this.nodeLookupValue = typeof resLookup.payload[0] !== 'object' ? { nodeid: '' } : JSON.parse(JSON.stringify(resLookup.payload[0]));
              break;
            case 1:
              this.channelLookupValue = typeof resLookup.payload[0] !== 'object' ? [] : JSON.parse(JSON.stringify(resLookup.payload));
              break;
            default:
              break;
          }
          this.flgSetLookupValue = true;
          this.logger.info(this.nodeLookupValue);
          this.logger.info(this.channelLookupValue);
        }
        if (resLookup.type === CLNActions.UPDATE_API_CALL_STATUS_CLN && resLookup.payload.status === APICallStatusEnum.ERROR && resLookup.payload.action === 'Lookup') {
          this.flgLoading[0] = 'error';
        }
      });
  }

  onLookup(): boolean | void {
    if (!this.lookupKey) {
      return true;
    }
    this.flgSetLookupValue = false;
    this.nodeLookupValue = { nodeid: '' };
    this.channelLookupValue = [];
    switch (this.selectedFieldId) {
      case 0:
        this.store.dispatch(peerLookup({ payload: this.lookupKey.trim() }));
        break;
      case 1:
        this.store.dispatch(channelLookup({ payload: { uiMessage: UI_MESSAGES.SEARCHING_CHANNEL, shortChannelID: this.lookupKey.trim(), showError: false } }));
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
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
