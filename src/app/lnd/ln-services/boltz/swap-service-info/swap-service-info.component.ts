import { Component, Input } from '@angular/core';
import { SwapTypeEnum } from '../../../../shared/services/consts-enums-functions';
import { ServiceInfo } from '../../../../shared/models/boltzModels';

@Component({
  selector: 'rtl-boltz-service-info',
  templateUrl: './swap-service-info.component.html',
  styleUrls: ['./swap-service-info.component.scss']
})
export class SwapServiceInfoComponent {

  @Input() serviceInfo: ServiceInfo = {};
  @Input() direction = SwapTypeEnum.SWAP_OUT;
  public swapTypeEnum = SwapTypeEnum;

  constructor() {}

}
