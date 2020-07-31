import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Channel } from '../../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class CLChannelLiquidityInfoComponent {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];

  constructor(private router: Router) {}

  goToChannels() {
    this.router.navigateByUrl('/cl/peerschannels');
  }

}
