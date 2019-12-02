import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

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
    { id: 0, name: 'Node', placeholder: 'Pubkey'},
    { id: 1, name: 'Channel', placeholder: 'Channel ID'}
  ];
  public flgLoading: Array<Boolean | 'error'> = [true];
  public faSearch = faSearch;
  private unSubs: Array<Subject<void>> = [new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.actions$
    .pipe(
      takeUntil(this.unSubs[0]),
      filter((action) => (action.type === RTLActions.SET_LOOKUP || action.type === RTLActions.EFFECT_ERROR_LND))
    ).subscribe((resLookup: RTLActions.SetLookup | RTLActions.EffectErrorLnd) => {
      if(resLookup.type === RTLActions.SET_LOOKUP) {
        this.flgLoading[0] = true;
        this.lookupValue = JSON.parse(JSON.stringify(resLookup.payload));
        this.flgSetLookupValue = true;
        this.logger.info(this.lookupValue);
      }
      if (resLookup.type === RTLActions.EFFECT_ERROR_LND && resLookup.payload.action === 'Lookup') {
        this.flgLoading[0] = 'error';
      }
    });
  }

  onLookup() {
    this.flgSetLookupValue = false;
    this.lookupValue = {};
    this.store.dispatch(new RTLActions.OpenSpinner('Searching ' + this.lookupFields[this.selectedFieldId].name + '...'));
    switch (this.selectedFieldId) {
      case 0:
        this.store.dispatch(new RTLActions.PeerLookup(this.lookupKey.trim()));
        break;
      case 1:
        this.store.dispatch(new RTLActions.ChannelLookup(this.lookupKey.trim()));
        break;
      default:
        break;
    }
  }

  onSelectChange(event: any) {
    this.flgSetLookupValue = false;
    this.lookupKey = '';
    this.lookupValue = {};
  }

  resetData() {
    this.flgSetLookupValue = false;
    this.selectedFieldId = 0;
    this.lookupKey = '';
    this.lookupValue = {};
    this.flgLoading.forEach((flg, i) => {
      this.flgLoading[i] = true;
    });
  }

  clearLookupValue() {
    this.lookupValue = {};
    this.flgSetLookupValue = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
