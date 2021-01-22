import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLOnChainComponent } from './on-chain/on-chain.component';
import { CLConnectionsComponent } from './peers-channels/connections.component';
import { CLTransactionsComponent } from '../clightning/transactions/transactions.component';
import { CLRoutingComponent } from '../clightning/routing/routing.component';
import { CLLookupsComponent } from './lookups/lookups.component';
import { CLNetworkInfoComponent } from './network-info/network-info.component';
import { CLSignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { CLOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { CLOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { CLChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { CLChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { CLChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { CLPeersComponent } from './peers-channels/peers/peers.component';
import { CLLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { CLLightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { CLQueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { CLSignComponent } from './sign-verify-message/sign/sign.component';
import { CLVerifyComponent } from './sign-verify-message/verify/verify.component';
import { CLForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { CLFailedTransactionsComponent } from './routing/failed-transactions/failed-transactions.component';
import { CLReportsComponent } from './reports/reports.component';
import { CLFeeReportComponent } from './reports/fee/fee-report.component';
import { CLTransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { CLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const ClRoutes: Routes = [
  { path: '', component: CLRootComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: CLHomeComponent, canActivate: [CLUnlockedGuard] },
      { path: 'onchain', component: CLOnChainComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'receive/utxos' },
        { path: 'receive/:selTab', component: CLOnChainReceiveComponent, canActivate: [CLUnlockedGuard] },
        { path: 'send/:selTab', component: CLOnChainSendComponent, data : {sweepAll : false}, canActivate: [CLUnlockedGuard] },
        { path: 'sweep/:selTab', component: CLOnChainSendComponent, data : {sweepAll : true}, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'connections', component: CLConnectionsComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'channels' },
        { path: 'channels', component: CLChannelsTablesComponent, canActivate: [CLUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'open' },
          { path: 'open', component: CLChannelOpenTableComponent, canActivate: [CLUnlockedGuard] },
          { path: 'pending', component: CLChannelPendingTableComponent, canActivate: [CLUnlockedGuard] }
        ] },
        { path: 'peers', component: CLPeersComponent, data : {sweepAll : false}, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'transactions', component: CLTransactionsComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'payments' },
        { path: 'payments', component: CLLightningPaymentsComponent, canActivate: [CLUnlockedGuard] },
        { path: 'invoices', component: CLLightningInvoicesComponent, canActivate: [CLUnlockedGuard] },
        { path: 'queryroutes', component: CLQueryRoutesComponent, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'messages', component: CLSignVerifyMessageComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'sign' },
        { path: 'sign', component: CLSignComponent, canActivate: [CLUnlockedGuard] },
        { path: 'verify', component: CLVerifyComponent, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'routing', component: CLRoutingComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'forwardinghistory' },
        { path: 'forwardinghistory', component: CLForwardingHistoryComponent, canActivate: [CLUnlockedGuard] },
        { path: 'failedtransactions', component: CLFailedTransactionsComponent, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'reports', component: CLReportsComponent, canActivate: [CLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'routingfees' },
        { path: 'routingfees', component: CLFeeReportComponent, canActivate: [CLUnlockedGuard] },
        { path: 'transactions', component: CLTransactionsReportComponent, canActivate: [CLUnlockedGuard] }
      ] },
      { path: 'lookups', component: CLLookupsComponent, canActivate: [CLUnlockedGuard] },
      { path: 'rates', component: CLNetworkInfoComponent, canActivate: [CLUnlockedGuard] },
      { path: '**', component: NotFoundComponent },
      { path: 'network', redirectTo: 'rates' },
      { path: 'wallet', redirectTo: 'home' },
      { path: 'backup', redirectTo: 'home' }
    ]
  }
];

export const CLRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(ClRoutes);
