import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { PeersChannelsComponent } from './peers-channels/peers-channels.component';
import { WalletComponent } from './wallet/wallet.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { RoutingComponent } from './routing/routing.component';
import { OnChainComponent } from './on-chain/on-chain.component';
import { NetworkInfoComponent } from './network-info/network-info.component';
import { BackupComponent } from './backup/backup.component';
import { SignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { NotFoundComponent } from '../shared/components/not-found/not-found.component';

import { AuthGuard, LNDUnlockedGuard } from '../shared/services/auth.guard';

export const LndRoutes: Routes = [
  { path: '', component: LNDRootComponent,
    children: [
    { path: 'wallet', component: WalletComponent, canActivate: [AuthGuard] },
    { path: 'home', component: HomeComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'onchain', component: OnChainComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'peerschannels', component: PeersChannelsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'transactions', component: TransactionsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'signverify', component: SignVerifyMessageComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'backup', component: BackupComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'routing', component: RoutingComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'lookups', component: LookupsComponent, canActivate: [LNDUnlockedGuard] },
    { path: 'network', component: NetworkInfoComponent, canActivate: [LNDUnlockedGuard] },
    { path: '**', component: NotFoundComponent },
    { path: 'rates', redirectTo: 'network' }
  ]}
];

export const LNDRouting: ModuleWithProviders = RouterModule.forChild(LndRoutes);
