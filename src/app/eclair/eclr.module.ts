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
import { ECLROnChainComponent } from './on-chain/on-chain.component';
import { ECLROnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { ECLROnChainSendComponent } from './on-chain/on-chain-send-modal/on-chain-send.component';
import { ECLRPeersChannelsComponent } from './peers-channels/peers-channels.component';
import { ECLRPeersComponent } from './peers-channels/peers/peers.component';
import { ECLRConnectPeerComponent } from './peers-channels/connect-peer/connect-peer.component';
import { ECLRChannelInformationComponent } from './peers-channels/channels/channel-information-modal/channel-information.component';
import { ECLROpenChannelComponent } from './peers-channels/channels/open-channel-modal/open-channel.component';
import { ECLRChannelsTableComponent } from './peers-channels/channels/channels-table/channels-table.component';

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
    ECLRChannelLiquidityInfoComponent,
    ECLROnChainComponent,
    ECLROnChainReceiveComponent,
    ECLROnChainSendComponent,
    ECLRPeersComponent,
    ECLRPeersChannelsComponent,
    ECLRChannelsTableComponent,
    ECLRConnectPeerComponent,
    ECLRChannelInformationComponent,
    ECLROpenChannelComponent
  ],
  providers: [
    ECLRUnlockedGuard
  ],
  bootstrap: [ECLRRootComponent]
})
export class ECLRModule {}
