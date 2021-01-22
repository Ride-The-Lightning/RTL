import { Component, OnInit, Input } from '@angular/core';
import { SwapTypeEnum } from '../../../../services/consts-enums-functions';
import { ServiceInfo } from '../../../../models/boltzModels';

@Component({
  selector: 'rtl-boltz-service-info',
  templateUrl: './swap-service-info.component.html',
  styleUrls: ['./swap-service-info.component.scss']
})
export class SwapServiceInfoComponent implements OnInit {
  @Input() serviceInfo: ServiceInfo = {};
  @Input() direction = SwapTypeEnum.SWAP_OUT;
  public swapTypeEnum = SwapTypeEnum;

  constructor() {}

  ngOnInit() {}

}
