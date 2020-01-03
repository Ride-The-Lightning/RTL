import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { CLEffects } from '../../store/cl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class CLOnChainReceiveComponent implements OnInit, OnDestroy {
  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType = ADDRESS_TYPES[0];
  public newAddress = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private lndEffects: CLEffects) {}

  ngOnInit() {}

  onGenerateAddress() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting New Address...'));
    this.store.dispatch(new RTLActions.GetNewAddressCL(this.selectedAddressType));
    this.lndEffects.setNewAddressCL
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(newAddress => {
      this.newAddress = newAddress;
      this.store.dispatch(new RTLActions.OpenAlert({
        width: '58%',
        data: {
          address: this.newAddress,
          addressType: this.selectedAddressType.addressTp,
          component: OnChainGeneratedAddressComponent
        }
      }));
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}
