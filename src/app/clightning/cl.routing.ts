import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLChannelsComponent } from './channels/channels.component';
import { CLInvoicesComponent } from './invoices/invoices.component';
import { CLLookupsComponent } from './lookups/lookups.component';
import { CLChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { CLNodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { CLOnChainComponent } from './on-chain/on-chain.component';
import { CLQueryRoutesComponent } from './payments/query-routes/query-routes.component';
import { CLPaymentsComponent } from './payments/send-receive/payments.component';
import { CLPeersComponent } from './peers/peers.component';
import { CLForwardingHistoryComponent } from './switch/forwarding-history.component';

import { CLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const ClRoutes: Routes = [
  { path: '', component: CLRootComponent,
    children: [
    { path: 'home', component: CLHomeComponent, canActivate: [CLUnlockedGuard] },
    { path: 'peers', component: CLPeersComponent, canActivate: [CLUnlockedGuard] },
    { path: 'chnlmanage', component: CLChannelsComponent, canActivate: [CLUnlockedGuard] },
    { path: 'onchain', component: CLOnChainComponent, canActivate: [CLUnlockedGuard] },
    { path: 'paymentsend', component: CLPaymentsComponent, canActivate: [CLUnlockedGuard] },
    { path: 'queryroutes', component: CLQueryRoutesComponent, canActivate: [CLUnlockedGuard] },
    { path: 'invoices', component: CLInvoicesComponent, canActivate: [CLUnlockedGuard] },
    { path: 'switch', component: CLForwardingHistoryComponent, canActivate: [CLUnlockedGuard] },
    { path: 'lookups', component: CLLookupsComponent, canActivate: [CLUnlockedGuard] },
    { path: '**', component: NotFoundComponent }
  ]}
];

export const CLRouting: ModuleWithProviders = RouterModule.forChild(ClRoutes);
