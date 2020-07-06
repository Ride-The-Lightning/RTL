import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { ECLRootComponent } from './ecl-root.component';
import { ECLHomeComponent } from './home/home.component';
import { ECLOnChainComponent } from './on-chain/on-chain.component';
import { ECLPeersChannelsComponent } from './peers-channels/peers-channels.component';
import { ECLTransactionsComponent } from './transactions/transactions.component';
import { ECLRoutingComponent } from './routing/routing.component';
import { ECLUnlockedGuard } from '../shared/services/auth.guard';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

export const EclRoutes: Routes = [
  { path: '', component: ECLRootComponent,
    children: [
    { path: 'home', component: ECLHomeComponent, canActivate: [ECLUnlockedGuard] },
    { path: 'onchain', component: ECLOnChainComponent, canActivate: [ECLUnlockedGuard] },
    { path: 'peerschannels', component: ECLPeersChannelsComponent, canActivate: [ECLUnlockedGuard] },
    { path: 'transactions', component: ECLTransactionsComponent, canActivate: [ECLUnlockedGuard] },
    { path: 'routing', component: ECLRoutingComponent, canActivate: [ECLUnlockedGuard] },
    // { path: 'lookups', component: ECLLookupsComponent, canActivate: [ECLUnlockedGuard] },
    { path: '**', component: NotFoundComponent }
  ]}
];

export const ECLRouting: ModuleWithProviders = RouterModule.forChild(EclRoutes);
