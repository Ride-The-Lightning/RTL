import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { ECLEffects } from '../../store/ecl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class ECLOnChainReceiveComponent implements OnInit {
  public newAddress = '';

  constructor(private store: Store<fromRTLReducer.RTLState>, private eclEffects: ECLEffects) {}

  ngOnInit() {}

  onGenerateAddress() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting New Address...'));
    this.store.dispatch(new ECLActions.GetNewAddress());
    this.eclEffects.setNewAddress.pipe(take(1))
    .subscribe(newAddress => {
      this.newAddress = newAddress;
      this.store.dispatch(new RTLActions.OpenAlert({
        width: '58%',
        data: {
          address: this.newAddress,
          addressType: '',
          component: OnChainGeneratedAddressComponent
        }
      }));
    });
  }

}
