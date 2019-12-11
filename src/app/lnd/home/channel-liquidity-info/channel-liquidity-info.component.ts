import { Component, OnChanges, Input } from '@angular/core';

import { Channel } from '../../../shared/models/lndModels';

@Component({
  selector: 'rtl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class ChannelLiquidityInfoComponent implements OnChanges {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];
  public maxAmount = 0;

  constructor() {}

  ngOnChanges() {
    if (this.allChannels && this.allChannels.length > 0) {
      if(this.direction === 'In') {
        this.maxAmount =  this.allChannels[0].remote_balance;
      } else {
        this.maxAmount = this.allChannels[0].local_balance;
      }
    }
  }

}
