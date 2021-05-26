import { Component, Input } from '@angular/core';

import { SwapTypeEnum } from '../../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-boltz-swap-status',
  templateUrl: './swap-status.component.html',
  styleUrls: ['./swap-status.component.scss']
})
export class SwapStatusComponent {
  @Input() swapStatus: any = null;
  @Input() direction = SwapTypeEnum.SWAP_OUT;
  public swapTypeEnum = SwapTypeEnum;

  constructor() {}

}
