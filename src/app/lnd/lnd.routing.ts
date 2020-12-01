import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { ConnectionsComponent } from './peers-channels/connections.component';
import { ChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { PeersComponent } from './peers-channels/peers/peers.component';
import { WalletComponent } from './wallet/wallet.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { RoutingComponent } from './routing/routing.component';
import { ReportsComponent } from './reports/reports.component';
import { FeeReportComponent } from './reports/fee/fee-report.component';
import { PaymentsReportComponent } from './reports/payments/payments-report.component';
import { OnChainComponent } from './on-chain/on-chain.component';
import { OnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { OnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { NetworkInfoComponent } from './network-info/network-info.component';
import { LoopComponent } from './loop/loop.component';
import { BackupComponent } from './backup/backup.component';
import { SignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

import { AuthGuard, LNDUnlockedGuard } from '../shared/services/auth.guard';

export const LndRoutes: Routes = [
  { path: '', component: LNDRootComponent,
    children: [
    { path: 'wallet', component: WalletComponent, canActivate: [AuthGuard] },
    { path: 'home', component: HomeComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'onchain', component: OnChainComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'receive' },
      { path: 'receive', component: OnChainReceiveComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'send', component: OnChainSendComponent, data : {sweepAll : false}, canActivate: [LNDUnlockedGuard] },
      { path: 'sweep', component: OnChainSendComponent, data : {sweepAll : true}, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'connections', component: ConnectionsComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'channels' },
      { path: 'channels', component: ChannelsTablesComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'peers', component: PeersComponent, data : {sweepAll : false}, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'transactions', component: TransactionsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'signverify', component: SignVerifyMessageComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'backup', component: BackupComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'routing', component: RoutingComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'reports', component: ReportsComponent, canActivate: [LNDUnlockedGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'fees' },
      { path: 'fees', component: FeeReportComponent, canActivate: [LNDUnlockedGuard] },
      { path: 'payments', component: PaymentsReportComponent, canActivate: [LNDUnlockedGuard] }
    ] },
    { path: 'lookups', component: LookupsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'network', component: NetworkInfoComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'loop', component: LoopComponent, canActivate: [LNDUnlockedGuard] },    
    { path: '**', component: NotFoundComponent },
    { path: 'rates', redirectTo: 'network' }
  ]}
];

export const LNDRouting: ModuleWithProviders = RouterModule.forChild(LndRoutes);
