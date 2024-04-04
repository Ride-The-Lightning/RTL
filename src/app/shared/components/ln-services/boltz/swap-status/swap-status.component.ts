import { Component, Input, OnInit } from '@angular/core';

import { SwapTypeEnum, ScreenSizeEnum } from '../../../../services/consts-enums-functions';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'rtl-boltz-swap-status',
  templateUrl: './swap-status.component.html',
  styleUrls: ['./swap-status.component.scss']
})
export class SwapStatusComponent implements OnInit {

  @Input() swapStatus: any = null;
  @Input() direction = SwapTypeEnum.SWAP_OUT;
  @Input() acceptZeroConf = false;
  @Input() sendFromInternal = true;
  public qrWidth = 240;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public swapTypeEnum = SwapTypeEnum;

  constructor(private commonService: CommonService) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.qrWidth = 180;
    }
  }

}
