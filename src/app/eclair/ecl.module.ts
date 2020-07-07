import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ECLRouting } from './ecl.routing';
import { SharedModule } from '../shared/shared.module';

import { ECLRootComponent } from './ecl-root.component';
import { ECLHomeComponent } from './home/home.component';
import { ECLNodeInfoComponent } from './home/node-info/node-info.component';
import { ECLBalancesInfoComponent } from './home/balances-info/balances-info.component';
import { ECLFeeInfoComponent } from './home/fee-info/fee-info.component';
import { ECLChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { ECLChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { ECLChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';
import { ECLOnChainComponent } from './on-chain/on-chain.component';
import { ECLOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { ECLOnChainTransactionHistoryComponent } from './on-chain/on-chain-transaction-history/on-chain-transaction-history.component';
import { ECLPeersChannelsComponent } from './peers-channels/peers-channels.component';
import { ECLPeersComponent } from './peers-channels/peers/peers.component';
import { ECLChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { ECLChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { ECLChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ECLChannelInactiveTableComponent } from './peers-channels/channels/channels-tables/channel-inactive-table/channel-inactive-table.component';
import { ECLTransactionsComponent } from './transactions/transactions.component';
import { ECLQueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { ECLLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ECLLightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { ECLRoutingComponent } from './routing/routing.component';
import { ECLForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { ECLLookupsComponent } from './lookups/lookups.component';
import { ECLNodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { ECLUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    ECLRouting
  ],
  declarations: [
    ECLRootComponent,
    ECLHomeComponent,
    ECLNodeInfoComponent,
    ECLBalancesInfoComponent,
    ECLFeeInfoComponent,
    ECLChannelStatusInfoComponent,
    ECLChannelCapacityInfoComponent,
    ECLChannelLiquidityInfoComponent,
    ECLOnChainComponent,
    ECLOnChainReceiveComponent,
    ECLOnChainTransactionHistoryComponent,
    ECLPeersComponent,
    ECLPeersChannelsComponent,
    ECLChannelsTablesComponent,
    ECLChannelOpenTableComponent,
    ECLChannelPendingTableComponent,
    ECLChannelInactiveTableComponent,
    ECLRoutingComponent,
    ECLForwardingHistoryComponent,
    ECLTransactionsComponent,
    ECLQueryRoutesComponent,
    ECLLightningPaymentsComponent,
    ECLLightningInvoicesComponent,
    ECLLookupsComponent,
    ECLNodeLookupComponent
  ],
  providers: [
    ECLUnlockedGuard
  ],
  bootstrap: [ECLRootComponent]
})
export class ECLModule {}
