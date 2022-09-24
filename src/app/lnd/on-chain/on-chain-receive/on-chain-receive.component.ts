import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AddressType, GetInfo } from '../../../shared/models/lndModels';
import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';
import { OnChainGeneratedAddressComponent } from '../../../shared/components/data-modal/on-chain-generated-address/on-chain-generated-address.component';

import { LNDEffects } from '../../store/lnd.effects';
import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getNewAddress } from '../../store/lnd.actions';
import { lndNodeInformation } from '../../store/lnd.selector';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'rtl-on-chain-receive',
  templateUrl: './on-chain-receive.component.html',
  styleUrls: ['./on-chain-receive.component.scss']
})
export class OnChainReceiveComponent implements OnInit, OnDestroy {

  public addressTypes = <any>[];
  public selectedAddressType: AddressType = ADDRESS_TYPES[0];
  public newAddress = '';
  public flgVersionCompatible = true;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private lndEffects: LNDEffects, private commonService: CommonService) { }

  ngOnInit() {
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeInfo: GetInfo) => {
        this.flgVersionCompatible = this.commonService.isVersionCompatible(nodeInfo.version, '0.15.0');
        this.addressTypes = (this.flgVersionCompatible) ? ADDRESS_TYPES : ADDRESS_TYPES.filter((at) => at.addressId !== '4');
        console.warn(this.flgVersionCompatible);
      });
  }

  onGenerateAddress() {
    this.store.dispatch(getNewAddress({ payload: this.selectedAddressType }));
    this.lndEffects.setNewAddress.pipe(take(1)).subscribe((newAddress) => {
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

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}
