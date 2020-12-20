import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Channel } from '../../../shared/models/clModels';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';

@Component({
  selector: 'rtl-cl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class CLChannelLiquidityInfoComponent implements OnInit {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private router: Router, private commonService: CommonService) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
  }

  goToChannels() {
    this.router.navigateByUrl('/cl/connections');
  }

}
