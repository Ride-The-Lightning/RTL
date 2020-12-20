import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { ECLRootComponent } from './ecl-root.component';
import { ECLHomeComponent } from './home/home.component';
import { ECLOnChainComponent } from './on-chain/on-chain.component';
import { ECLConnectionsComponent } from './peers-channels/connections.component';
import { ECLTransactionsComponent } from './transactions/transactions.component';
import { ECLRoutingComponent } from './routing/routing.component';
import { ECLLookupsComponent } from './lookups/lookups.component';
import { ECLOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { ECLOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { ECLChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { ECLChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { ECLChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { ECLPeersComponent } from './peers-channels/peers/peers.component';
import { ECLLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ECLLightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { ECLQueryRoutesComponent } from './transactions/query-routes/query-routes.component';
import { ECLChannelInactiveTableComponent } from './peers-channels/channels/channels-tables/channel-inactive-table/channel-inactive-table.component';
import { ECLForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { ECLRoutingPeersComponent } from './routing/routing-peers/routing-peers.component';
import { ECLReportsComponent } from './reports/reports.component';
import { ECLFeeReportComponent } from './reports/fee/fee-report.component';
import { ECLTransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { ECLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const EclRoutes: Routes = [
  { path: '', component: ECLRootComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: ECLHomeComponent, canActivate: [ECLUnlockedGuard] },
      { path: 'onchain', component: ECLOnChainComponent, canActivate: [ECLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'receive' },
        { path: 'receive', component: ECLOnChainReceiveComponent, canActivate: [ECLUnlockedGuard] },
        { path: 'send', component: ECLOnChainSendComponent, canActivate: [ECLUnlockedGuard] }
      ] },
      { path: 'connections', component: ECLConnectionsComponent, canActivate: [ECLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'channels' },
        { path: 'channels', component: ECLChannelsTablesComponent, canActivate: [ECLUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'open' },
          { path: 'open', component: ECLChannelOpenTableComponent, canActivate: [ECLUnlockedGuard] },
          { path: 'pending', component: ECLChannelPendingTableComponent, canActivate: [ECLUnlockedGuard] },
          { path: 'inactive', component: ECLChannelInactiveTableComponent, canActivate: [ECLUnlockedGuard] }
        ] },
        { path: 'peers', component: ECLPeersComponent, data : {sweepAll : false}, canActivate: [ECLUnlockedGuard] }
      ] },
      { path: 'transactions', component: ECLTransactionsComponent, canActivate: [ECLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'payments' },
        { path: 'payments', component: ECLLightningPaymentsComponent, canActivate: [ECLUnlockedGuard] },
        { path: 'invoices', component: ECLLightningInvoicesComponent, canActivate: [ECLUnlockedGuard] },
        { path: 'queryroutes', component: ECLQueryRoutesComponent, canActivate: [ECLUnlockedGuard] }
      ] },
      { path: 'routing', component: ECLRoutingComponent, canActivate: [ECLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'forwardinghistory' },
        { path: 'forwardinghistory', component: ECLForwardingHistoryComponent, canActivate: [ECLUnlockedGuard] },
        { path: 'peers', component: ECLRoutingPeersComponent, canActivate: [ECLUnlockedGuard] }
      ] },
      { path: 'reports', component: ECLReportsComponent, canActivate: [ECLUnlockedGuard], children: [
        { path: '', pathMatch: 'full', redirectTo: 'routingfees' },
        { path: 'routingfees', component: ECLFeeReportComponent, canActivate: [ECLUnlockedGuard] },
        { path: 'transactions', component: ECLTransactionsReportComponent, canActivate: [ECLUnlockedGuard] }
      ] },
      { path: 'lookups', component: ECLLookupsComponent, canActivate: [ECLUnlockedGuard] },
      { path: '**', component: NotFoundComponent }
    ]
  }
];

export const ECLRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(EclRoutes);
