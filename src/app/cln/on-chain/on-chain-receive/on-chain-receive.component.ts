import { Component } from '@angular/core';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { CLNEffects } from '../../store/cln.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getNewAddress } from '../../store/cln.actions';

@Component({
  selector: 'rtl-cln-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class CLNOnChainReceiveComponent {

  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType = ADDRESS_TYPES[2];
  public newAddress = '';

  constructor(private store: Store<RTLState>, private clnEffects: CLNEffects) { }

  onGenerateAddress() {
    this.store.dispatch(getNewAddress({ payload: this.selectedAddressType }));
    this.clnEffects.setNewAddressCL.pipe(take(1)).subscribe((newAddress) => {
      this.newAddress = newAddress;
      setTimeout(() => {
        this.store.dispatch(openAlert({
          payload: {
            data: {
              address: this.newAddress,
              addressType: this.selectedAddressType.addressTp,
              component: OnChainGeneratedAddressComponent
            }
          }
        }));
      }, 0);
    });
  }

}
