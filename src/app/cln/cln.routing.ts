import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { CLNRootComponent } from './cln-root.component';
import { CLNHomeComponent } from './home/home.component';
import { CLNOnChainComponent } from './on-chain/on-chain.component';
import { CLNConnectionsComponent } from './peers-channels/connections.component';
import { CLNTransactionsComponent } from './transactions/transactions.component';
import { CLNRoutingComponent } from './routing/routing.component';
import { CLNLookupsComponent } from './graph/lookups/lookups.component';
import { CLNNetworkInfoComponent } from './network-info/network-info.component';
import { CLNSignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { CLNOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { CLNOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { CLNChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { CLNChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { CLNChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { CLNPeersComponent } from './peers-channels/peers/peers.component';
import { CLNLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { CLNLightningInvoicesTableComponent } from './transactions/invoices/invoices-table/lightning-invoices-table.component';
import { CLNQueryRoutesComponent } from './graph/query-routes/query-routes.component';
import { CLNSignComponent } from './sign-verify-message/sign/sign.component';
import { CLNVerifyComponent } from './sign-verify-message/verify/verify.component';
import { CLNForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { CLNFailedTransactionsComponent } from './routing/failed-transactions/failed-transactions.component';
import { CLNRoutingPeersComponent } from './routing/routing-peers/routing-peers.component';

import { CLNReportsComponent } from './reports/reports.component';
import { CLNFeeReportComponent } from './reports/fee/fee-report.component';
import { CLNTransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { CLNUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';
import { CLNGraphComponent } from './graph/graph.component';
import { CLNOffersTableComponent } from './transactions/offers/offers-table/offers-table.component';
import { CLNOfferBookmarksTableComponent } from './transactions/offers/offer-bookmarks-table/offer-bookmarks-table.component';
import { CLNLocalFailedTransactionsComponent } from './routing/local-failed-transactions/local-failed-transactions.component';

export const ClnRoutes: Routes = [
  {
    path: '', component: CLNRootComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', component: CLNHomeComponent, canActivate: [CLNUnlockedGuard] },
      {
        path: 'onchain', component: CLNOnChainComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'receive/utxos' },
          { path: 'receive/:selTab', component: CLNOnChainReceiveComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'send/:selTab', component: CLNOnChainSendComponent, data: { sweepAll: false }, canActivate: [CLNUnlockedGuard] },
          { path: 'sweep/:selTab', component: CLNOnChainSendComponent, data: { sweepAll: true }, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'connections', component: CLNConnectionsComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'channels' },
          {
            path: 'channels', component: CLNChannelsTablesComponent, canActivate: [CLNUnlockedGuard], children: [
              { path: '', pathMatch: 'full', redirectTo: 'open' },
              { path: 'open', component: CLNChannelOpenTableComponent, canActivate: [CLNUnlockedGuard] },
              { path: 'pending', component: CLNChannelPendingTableComponent, canActivate: [CLNUnlockedGuard] }
            ]
          },
          { path: 'peers', component: CLNPeersComponent, data: { sweepAll: false }, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'transactions', component: CLNTransactionsComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'payments' },
          { path: 'payments', component: CLNLightningPaymentsComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'invoices', component: CLNLightningInvoicesTableComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'offers', component: CLNOffersTableComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'offrBookmarks', component: CLNOfferBookmarksTableComponent, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'messages', component: CLNSignVerifyMessageComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'sign' },
          { path: 'sign', component: CLNSignComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'verify', component: CLNVerifyComponent, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'routing', component: CLNRoutingComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'forwardinghistory' },
          { path: 'forwardinghistory', component: CLNForwardingHistoryComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'failedtransactions', component: CLNFailedTransactionsComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'localfail', component: CLNLocalFailedTransactionsComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'routingpeers', component: CLNRoutingPeersComponent, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'reports', component: CLNReportsComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'routingfees' },
          { path: 'routingfees', component: CLNFeeReportComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'transactions', component: CLNTransactionsReportComponent, canActivate: [CLNUnlockedGuard] }
        ]
      },
      {
        path: 'graph', component: CLNGraphComponent, canActivate: [CLNUnlockedGuard], children: [
          { path: '', pathMatch: 'full', redirectTo: 'lookups' },
          { path: 'lookups', component: CLNLookupsComponent, canActivate: [CLNUnlockedGuard] },
          { path: 'queryroutes', component: CLNQueryRoutesComponent, canActivate: [CLNUnlockedGuard] }
        ]
      },
      { path: 'rates', component: CLNNetworkInfoComponent, canActivate: [CLNUnlockedGuard] },
      { path: '**', component: NotFoundComponent },
      { path: 'network', redirectTo: 'rates' },
      { path: 'wallet', redirectTo: 'home' },
      { path: 'backup', redirectTo: 'home' }
    ]
  }
];

export const CLNRouting: ModuleWithProviders<RouterModule> = RouterModule.forChild(ClnRoutes);
