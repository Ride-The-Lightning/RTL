import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LNDRouting } from './lnd.routing';
import { SharedModule } from '../shared/shared.module';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { PeersChannelsComponent } from './peers-channels/peers-channels.component';
import { ChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { PeersComponent } from './peers-channels/peers/peers.component';
import { LightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { OnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { OnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { OnChainComponent } from './on-chain/on-chain.component';
import { OnChainTransactionHistoryComponent } from './on-chain/on-chain-transaction-history/on-chain-transaction-history.component';
import { UnlockLNDComponent } from './unlock-lnd/unlock-lnd.component';
import { LightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ChannelManageComponent } from './peers-channels/channels/channel-manage/channel-manage.component';
import { ChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ChannelClosedTableComponent } from './peers-channels/channels/channels-tables/channel-closed-table/channel-closed-table.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { ForwardingHistoryComponent } from './switch/forwarding-history.component';
import { RoutingPeersComponent } from './routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { ChannelBackupComponent } from './peers-channels/channels/channel-backup/channel-backup.component';
import { ChannelRestoreComponent } from './peers-channels/channels/channel-restore/channel-restore.component';
import { QueryRoutesComponent } from './payments/query-routes/query-routes.component';

import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { LNDUnlockedGuard } from '../shared/services/auth.guard';
import { ChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    LNDRouting
  ],
  declarations: [
    LNDRootComponent,
    HomeComponent,
    PeersComponent,
    PeersChannelsComponent,
    LightningInvoicesComponent,
    UnlockLNDComponent,
    LightningPaymentsComponent,
    ChannelManageComponent,
    ChannelPendingTableComponent,
    ChannelClosedTableComponent,
    TransactionsComponent,
    LookupsComponent,
    ForwardingHistoryComponent,
    RoutingPeersComponent,
    ChannelLookupComponent,
    NodeLookupComponent,
    ChannelBackupComponent,
    QueryRoutesComponent,
    ChannelRestoreComponent,
    OnChainSendComponent,
    OnChainReceiveComponent,
    OnChainComponent,
    OnChainTransactionHistoryComponent,
    ChannelsTablesComponent,
    ChannelOpenTableComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    LNDUnlockedGuard
  ],
  bootstrap: [LNDRootComponent]
})
export class LNDModule {}
