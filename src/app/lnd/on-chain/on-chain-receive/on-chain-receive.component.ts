import { Component } from '@angular/core';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AddressType } from '../../../shared/models/lndModels';
import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { LNDEffects } from '../../store/lnd.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getNewAddress } from '../../store/lnd.actions';

@Component({
  selector: 'rtl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class OnChainReceiveComponent {

  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType: AddressType = ADDRESS_TYPES[0];
  public newAddress = '';

  constructor(private store: Store<RTLState>, private lndEffects: LNDEffects) { }

  onGenerateAddress() {
    this.store.dispatch(getNewAddress({ payload: this.selectedAddressType }));
    this.lndEffects.setNewAddress.
      pipe(take(1)).
      subscribe((newAddress) => {
        this.newAddress = newAddress;
        this.store.dispatch(openAlert({
          payload: {
            width: '58%',
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
