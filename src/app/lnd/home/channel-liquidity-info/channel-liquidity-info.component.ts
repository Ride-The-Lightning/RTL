import { Component, Input } from '@angular/core';

import { Channel } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class ChannelLiquidityInfoComponent {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];

  constructor() {}
}
