import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLOnChainComponent } from './on-chain/on-chain.component';
import { CLPeersChannelsComponent } from '../clightning/peers-channels/peers-channels.component';
import { CLTransactionsComponent } from '../clightning/transactions/transactions.component';
import { CLRoutingComponent } from '../clightning/routing/routing.component';
import { CLLookupsComponent } from './lookups/lookups.component';
import { CLNetworkInfoComponent } from './network-info/network-info.component';
import { CLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const ClRoutes: Routes = [
  { path: '', component: CLRootComponent,
    children: [
    { path: 'home', component: CLHomeComponent, canActivate: [CLUnlockedGuard] },
    { path: 'onchain', component: CLOnChainComponent, canActivate: [CLUnlockedGuard] },
    { path: 'peerschannels', component: CLPeersChannelsComponent, canActivate: [CLUnlockedGuard] },
    { path: 'transactions', component: CLTransactionsComponent, canActivate: [CLUnlockedGuard] },
    { path: 'routing', component: CLRoutingComponent, canActivate: [CLUnlockedGuard] },
    { path: 'lookups', component: CLLookupsComponent, canActivate: [CLUnlockedGuard] },
    { path: 'rates', component: CLNetworkInfoComponent, canActivate: [CLUnlockedGuard] },
    { path: '**', component: NotFoundComponent },
    { path: 'network', redirectTo: 'rates' },
    { path: 'wallet', redirectTo: 'home' },
    { path: 'backup', redirectTo: 'home' }
  ]}
];

export const CLRouting: ModuleWithProviders = RouterModule.forChild(ClRoutes);
