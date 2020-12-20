import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as ECLActions from '../store/ecl.actions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { ScreenSizeEnum } from '../../shared/services/consts-enums-functions';
import { CommonService } from '../../shared/services/common.service';
import { FormControl } from '@angular/forms';
import { LookupNode } from '../../shared/models/eclModels';

@Component({
  selector: 'rtl-ecl-lookups',
  templateUrl: './lookups.component.html',
  styleUrls: ['./lookups.component.scss']
})
export class ECLLookupsComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true }) form: any;
  public lookupKeyCtrl = new FormControl();
  // public lookupKey = '';
  public nodeLookupValue: LookupNode = {};
  public channelLookupValue = [];
  public flgSetLookupValue = false;
  public temp: any;
  public messageObj = [];
  public selectedFieldId = 0;
  public lookupFields = [
    { id: 0, name: 'Node', placeholder: 'Node ID'},
    { id: 1, name: 'Channel', placeholder: 'Short Channel ID'}
  ];
  public flgLoading: Array<Boolean | 'error'> = [true];
  public faSearch = faSearch;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.actions$.pipe(takeUntil(this.unSubs[0]),
      filter((action) => (action.type === ECLActions.SET_LOOKUP_ECL || action.type === ECLActions.EFFECT_ERROR_ECL))).subscribe((resLookup: ECLActions.SetLookup | ECLActions.EffectError) => {
        if(resLookup.type === ECLActions.SET_LOOKUP_ECL) {
          this.flgLoading[0] = true;
          switch (this.selectedFieldId) {
            case 0:
              this.nodeLookupValue = resLookup.payload[0] ? JSON.parse(JSON.stringify(resLookup.payload[0])) : {nodeid: ''};
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
        if (resLookup.type === ECLActions.EFFECT_ERROR_ECL && resLookup.payload.action === 'Lookup') {
          this.flgLoading[0] = 'error';
        }
    });
    this.lookupKeyCtrl.valueChanges.pipe(takeUntil(this.unSubs[1])).subscribe(value => {
      this.nodeLookupValue = {};
      this.channelLookupValue = [];
      this.flgSetLookupValue = false;
    });
  }

  onLookup():boolean|void {
    if (!this.lookupKeyCtrl.value) {
      this.lookupKeyCtrl.setErrors({required: true});
      return true;
    } else if (this.lookupKeyCtrl.value && (this.lookupKeyCtrl.value.includes('@') || this.lookupKeyCtrl.value.includes(','))) {
      this.lookupKeyCtrl.setErrors({invalid: true});
      return true;
    } else {
      if (!this.selectedFieldId) {
        this.selectedFieldId = 0;
      }
      this.flgSetLookupValue = false;
      this.nodeLookupValue = {};
      this.channelLookupValue = [];
      this.store.dispatch(new RTLActions.OpenSpinner('Searching ' + this.lookupFields[this.selectedFieldId].name + '...'));
      switch (this.selectedFieldId) {
        case 0:
          this.store.dispatch(new ECLActions.PeerLookup(this.lookupKeyCtrl.value.trim()));
          break;
        case 1:
          // this.store.dispatch(new ECLActions.ChannelLookup({shortChannelID: this.lookupKey.trim(), showError: false}));
          break;
        default:
          break;
      }
    }
  }

  onSelectChange(event: any) {
    this.resetData();
    this.selectedFieldId = event.value;
  }

  resetData() {
    this.flgSetLookupValue = false;
    this.nodeLookupValue = {};
    this.channelLookupValue = [];
    this.lookupKeyCtrl.setValue('');
    this.lookupKeyCtrl.setErrors(null);
    this.form.resetForm();
  }

  clearLookupValue() {
    this.nodeLookupValue = {};
    this.channelLookupValue = [];
    this.flgSetLookupValue = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
