import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CLRouting } from './cl.routing';
import { SharedModule } from '../shared/shared.module';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLPeersChannelsComponent } from './peers-channels/peers-channels.component';
import { CLChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { CLPeersComponent } from './peers-channels/peers/peers.component';
import { CLLightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { CLOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { CLOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { CLOnChainComponent } from './on-chain/on-chain.component';
import { CLLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { CLChannelManageComponent } from './peers-channels/channels/channel-manage/channel-manage.component';
import { CLTransactionsComponent } from './transactions/transactions.component';
import { CLLookupsComponent } from './lookups/lookups.component';
import { CLRoutingComponent } from './routing/routing.component';
import { CLForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { CLFailedTransactionsComponent } from './routing/failed-transactions/failed-transactions.component';
import { CLChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { CLNodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { CLQueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { CLChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { CLChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { CLNodeInfoComponent } from './home/node-info/node-info.component';
import { CLBalancesInfoComponent } from './home/balances-info/balances-info.component';
import { CLFeeInfoComponent } from './home/fee-info/fee-info.component';
import { CLChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { CLChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { CLChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';
import { CLNetworkInfoComponent } from './network-info/network-info.component';
import { CLFeeRatesComponent } from './network-info/fee-rates/fee-rates.component';

import { CLUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CLRouting
  ],
  declarations: [
    CLRootComponent,
    CLHomeComponent,
    CLPeersComponent,
    CLPeersChannelsComponent,
    CLLightningInvoicesComponent,
    CLLightningPaymentsComponent,
    CLChannelManageComponent,
    CLTransactionsComponent,
    CLLookupsComponent,
    CLRoutingComponent,
    CLForwardingHistoryComponent,
    CLFailedTransactionsComponent,
    CLChannelLookupComponent,
    CLNodeLookupComponent,
    CLQueryRoutesComponent,
    CLOnChainSendComponent,
    CLOnChainReceiveComponent,
    CLOnChainComponent,
    CLChannelsTablesComponent,
    CLChannelOpenTableComponent,
    CLChannelPendingTableComponent,
    CLNodeInfoComponent,
    CLBalancesInfoComponent,
    CLFeeInfoComponent,
    CLChannelStatusInfoComponent,
    CLChannelCapacityInfoComponent,
    CLChannelLiquidityInfoComponent,
    CLNetworkInfoComponent,
    CLFeeRatesComponent
  ],
  providers: [
    CLUnlockedGuard
  ],
  bootstrap: [CLRootComponent]
})
export class CLModule {}
