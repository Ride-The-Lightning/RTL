import { Component } from '@angular/core';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { CLEffects } from '../../store/cl.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getNewAddress } from '../../store/cl.actions';

@Component({
  selector: 'rtl-cl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class CLOnChainReceiveComponent {

  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType = ADDRESS_TYPES[0];
  public newAddress = '';

  constructor(private store: Store<RTLState>, private clEffects: CLEffects) { }

  onGenerateAddress() {
    this.store.dispatch(getNewAddress({ payload: this.selectedAddressType }));
    this.clEffects.setNewAddressCL.
      pipe(take(1)).
      subscribe((newAddress) => {
        this.newAddress = newAddress;
        this.store.dispatch(openAlert({
          payload: {
            data: {
              address: this.newAddress,
              addressType: this.selectedAddressType.addressTp,
              component: OnChainGeneratedAddressComponent
            }
          }
        }));
      });
  }

}
