import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ECLRRouting } from './eclr.routing';
import { SharedModule } from '../shared/shared.module';

import { ECLRRootComponent } from './eclr-root.component';
import { ECLRHomeComponent } from './home/home.component';
import { ECLRNodeInfoComponent } from './home/node-info/node-info.component';
import { ECLRBalancesInfoComponent } from './home/balances-info/balances-info.component';
import { ECLRFeeInfoComponent } from './home/fee-info/fee-info.component';
import { ECLRChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { ECLRChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { ECLRChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';

import { ECLRUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ECLRRouting
  ],
  declarations: [
    ECLRRootComponent,
    ECLRHomeComponent,
    ECLRNodeInfoComponent,
    ECLRBalancesInfoComponent,
    ECLRFeeInfoComponent,
    ECLRChannelStatusInfoComponent,
    ECLRChannelCapacityInfoComponent,
    ECLRChannelLiquidityInfoComponent
  ],
  providers: [
    ECLRUnlockedGuard
  ],
  bootstrap: [ECLRRootComponent]
})
export class ECLRModule {}
