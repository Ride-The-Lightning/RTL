import { Component } from '@angular/core';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { ECLEffects } from '../../store/ecl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getNewAddress } from '../../store/ecl.actions';

@Component({
  selector: 'rtl-ecl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class ECLOnChainReceiveComponent {

  public newAddress = '';

  constructor(private store: Store<RTLState>, private eclEffects: ECLEffects) { }

  onGenerateAddress() {
    this.store.dispatch(getNewAddress());
    this.eclEffects.setNewAddress.pipe(take(1)).
      subscribe((newAddress) => {
        this.newAddress = newAddress;
        this.store.dispatch(openAlert({
          payload: {
            data: {
              address: this.newAddress,
              addressType: '',
              component: OnChainGeneratedAddressComponent
            }
          }
        }));
      });
  }

}
