import { Component, OnChanges, Input } from '@angular/core';

import { ChannelCL } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class CLChannelLiquidityInfoComponent implements OnChanges {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: ChannelCL[];
  public maxAmount = 0;

  constructor() {}

  ngOnChanges() {
    if (this.allChannels && this.allChannels.length > 0) {
      if(this.direction === 'In') {
        this.maxAmount =  +this.allChannels[0].their_channel_reserve_satoshis <= 4294967 ? +this.allChannels[0].their_channel_reserve_satoshis : 4294967;
      } else {
        this.maxAmount =  +this.allChannels[0].our_channel_reserve_satoshis <= 4294967 ? +this.allChannels[0].our_channel_reserve_satoshis : 4294967;
      }
    }
  }

}
