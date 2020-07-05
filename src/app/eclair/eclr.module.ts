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
import { ECLROnChainTransactionHistoryComponent } from './on-chain/on-chain-transaction-history/on-chain-transaction-history.component';
import { ECLRPeersChannelsComponent } from './peers-channels/peers-channels.component';
import { ECLRPeersComponent } from './peers-channels/peers/peers.component';
import { ECLRChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { ECLRChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { ECLRChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ECLRChannelInactiveTableComponent } from './peers-channels/channels/channels-tables/channel-inactive-table/channel-inactive-table.component';
import { ECLRTransactionsComponent } from './transactions/transactions.component';
import { ECLRQueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { ECLRLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ECLRLightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { ECLRRoutingComponent } from './routing/routing.component';
import { ECLRForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
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
    ECLROnChainTransactionHistoryComponent,
    ECLRPeersComponent,
    ECLRPeersChannelsComponent,
    ECLRChannelsTablesComponent,
    ECLRChannelOpenTableComponent,
    ECLRChannelPendingTableComponent,
    ECLRChannelInactiveTableComponent,
    ECLRRoutingComponent,
    ECLRForwardingHistoryComponent,
    ECLRTransactionsComponent,
    ECLRQueryRoutesComponent,
    ECLRLightningPaymentsComponent,
    ECLRLightningInvoicesComponent
  ],
  providers: [
    ECLRUnlockedGuard
  ],
  bootstrap: [ECLRRootComponent]
})
export class ECLRModule {}
