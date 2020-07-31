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
import { OnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { OnChainComponent } from './on-chain/on-chain.component';
import { OnChainTransactionHistoryComponent } from './on-chain/on-chain-transaction-history/on-chain-transaction-history.component';
import { WalletComponent } from './wallet/wallet.component';
import { LightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ChannelClosedTableComponent } from './peers-channels/channels/channels-tables/channel-closed-table/channel-closed-table.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { RoutingComponent } from './routing/routing.component';
import { ForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { RoutingPeersComponent } from './routing/routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { BackupComponent } from './backup/backup.component';
import { ChannelBackupTableComponent } from './backup/channel-backup-table/channel-backup-table.component';
import { ChannelRestoreTableComponent } from './backup/channel-restore-table/channel-restore-table.component';
import { SignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { SignComponent } from './sign-verify-message/sign/sign.component';
import { VerifyComponent } from './sign-verify-message/verify/verify.component';
import { QueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { ChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { UnlockWalletComponent } from './wallet/unlock/unlock.component';
import { InitializeWalletComponent } from './wallet/initialize/initialize.component';
import { NodeInfoComponent } from './home/node-info/node-info.component';
import { BalancesInfoComponent } from './home/balances-info/balances-info.component';
import { FeeInfoComponent } from './home/fee-info/fee-info.component';
import { ChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { ChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { ChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';
import { NetworkInfoComponent } from './network-info/network-info.component';
import { LoopComponent } from './loop/loop.component';
import { SwapsComponent } from './loop/swaps/swaps.component';

import { LNDUnlockedGuard } from '../shared/services/auth.guard';

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
    WalletComponent,
    LightningPaymentsComponent,
    ChannelPendingTableComponent,
    ChannelClosedTableComponent,
    TransactionsComponent,
    LookupsComponent,
    RoutingComponent,
    ForwardingHistoryComponent,
    RoutingPeersComponent,
    ChannelLookupComponent,
    NodeLookupComponent,
    BackupComponent,
    ChannelBackupTableComponent,
    ChannelRestoreTableComponent,
    SignVerifyMessageComponent,
    SignComponent,
    VerifyComponent,
    QueryRoutesComponent,
    OnChainReceiveComponent,
    OnChainComponent,
    OnChainTransactionHistoryComponent,
    ChannelsTablesComponent,
    ChannelOpenTableComponent,
    UnlockWalletComponent,
    InitializeWalletComponent,
    NodeInfoComponent,
    BalancesInfoComponent,
    FeeInfoComponent,
    ChannelStatusInfoComponent,
    ChannelCapacityInfoComponent,
    ChannelLiquidityInfoComponent,
    NetworkInfoComponent,
    LoopComponent,
    SwapsComponent
  ],  
  providers: [
    LNDUnlockedGuard
  ],
  bootstrap: [LNDRootComponent]
})
export class LNDModule {}
