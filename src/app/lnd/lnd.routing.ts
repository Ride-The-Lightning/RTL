import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { ConnectionsComponent } from './peers-channels/connections.component';
import { PeersComponent } from './peers-channels/peers/peers.component';
import { ChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { ChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { ChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ChannelClosedTableComponent } from './peers-channels/channels/channels-tables/channel-closed-table/channel-closed-table.component';
import { ChannelActiveHTLCsTableComponent } from './peers-channels/channels/channels-tables/channel-active-htlcs-table/channel-active-htlcs-table.component';
import { WalletComponent } from './wallet/wallet.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { LightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { LightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { QueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { LookupsComponent } from './lookups/lookups.component';
import { RoutingComponent } from './routing/routing.component';
import { ForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { RoutingPeersComponent } from './routing/routing-peers/routing-peers.component';
import { ReportsComponent } from './reports/reports.component';
import { FeeReportComponent } from './reports/fee/fee-report.component';
import { TransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { OnChainComponent } from './on-chain/on-chain.component';
import { OnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { OnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { NetworkInfoComponent } from './network-info/network-info.component';
import { BackupComponent } from './backup/backup.component';
import { ChannelRestoreTableComponent } from './backup/channel-restore-table/channel-restore-table.component';
import { ChannelBackupTableComponent } from './backup/channel-backup-table/channel-backup-table.component';
import { SignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { SignComponent } from './sign-verify-message/sign/sign.component';
import { VerifyComponent } from './sign-verify-message/verify/verify.component';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

import { AuthGuard, LNDUnlockedGuard } from '../shared/services/auth.guard';

export const LndRoutes: Routes = [
  { path: '', component: LNDRootComponent,
    children: [
    { path: '', pathMatch: 'full', redirectTo: 'home' },
    { path: 'home', component: HomeComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'wallet', component: WalletComponent, canActivate: [AuthGuard] },
    { path: 'onchain', component: OnChainComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'receive/utxos' },
      { path: 'receive/:selTab', component: OnChainReceiveComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'send/:selTab', component: OnChainSendComponent, data : {sweepAll : false}, canActivate: [LNDUnlockedGuard] },
      { path: 'sweep/:selTab', component: OnChainSendComponent, data : {sweepAll : true}, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'connections', component: ConnectionsComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'channels' },
      { path: 'channels', component: ChannelsTablesComponent, canActivate: [LNDUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'open' },
        { path: 'open', component: ChannelOpenTableComponent, canActivate: [LNDUnlockedGuard] },
        { path: 'pending', component: ChannelPendingTableComponent, canActivate: [LNDUnlockedGuard] },
        { path: 'closed', component: ChannelClosedTableComponent, canActivate: [LNDUnlockedGuard] },
        { path: 'activehtlcs', component: ChannelActiveHTLCsTableComponent, canActivate: [LNDUnlockedGuard] }
      ] },
      { path: 'peers', component: PeersComponent, data : {sweepAll : false}, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'transactions', component: TransactionsComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'payments' },
      { path: 'payments', component: LightningPaymentsComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'invoices', component: LightningInvoicesComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'queryroutes', component: QueryRoutesComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'messages', component: SignVerifyMessageComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'sign' },
      { path: 'sign', component: SignComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'verify', component: VerifyComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'channelbackup', component: BackupComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'bckup' },
      { path: 'bckup', component: ChannelBackupTableComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'restore', component: ChannelRestoreTableComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'routing', component: RoutingComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'forwardinghistory' },
      { path: 'forwardinghistory', component: ForwardingHistoryComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'peers', component: RoutingPeersComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'reports', component: ReportsComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'routingfees' },
      { path: 'routingfees', component: FeeReportComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'transactions', component: TransactionsReportComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'lookups', component: LookupsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'network', component: NetworkInfoComponent, canActivate: [LNDUnlockedGuard] },
    { path: '**', component: NotFoundComponent },
    { path: 'rates', redirectTo: 'network' }
  ]}
];

export const LNDRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(LndRoutes);
