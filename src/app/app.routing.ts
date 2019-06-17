import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { NotFoundComponent } from './shared/components/not-found/not-found.component';

import { HomeComponent } from './pages/home/home.component';
import { UnlockLNDComponent } from './pages/unlock-lnd/unlock-lnd.component';
import { ChannelClosedComponent } from './pages/channels/channel-closed/channel-closed.component';
import { ChannelManageComponent } from './pages/channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './pages/channels/channel-pending/channel-pending.component';
import { PeersComponent } from './pages/peers/peers.component';
import { SendReceiveTransComponent } from './pages/transactions/send-receive/send-receive-trans.component';
import { ListTransactionsComponent } from './pages/transactions/list-transactions/list-transactions.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ServerConfigComponent } from './pages/server-config/server-config.component';
import { HelpComponent } from './pages/help/help.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LookupsComponent } from './pages/lookups/lookups.component';
import { SigninComponent } from './pages/signin/signin.component';
import { ForwardingHistoryComponent } from './pages/switch/forwarding-history.component';
import { RoutingPeersComponent } from './pages/routing-peers/routing-peers.component';
import { SsoFailedComponent } from './shared/components/sso-failed/sso-failed.component';
import { ChannelBackupComponent } from './pages/channels/channel-backup/channel-backup.component';

import { AuthGuard, LNDUnlockedGuard } from './shared/services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full', canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'unlocklnd', component: UnlockLNDComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'peers', component: PeersComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'chnlclosed', component: ChannelClosedComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'chnlmanage', component: ChannelManageComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'chnlpending', component: ChannelPendingComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'chnlbackup', component: ChannelBackupComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'transsendreceive', component: SendReceiveTransComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'translist', component: ListTransactionsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'payments', component: PaymentsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'invoices', component: InvoicesComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'switch', component: ForwardingHistoryComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'routingpeers', component: RoutingPeersComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'lookups', component: LookupsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: 'sconfig', component: ServerConfigComponent, canActivate: [AuthGuard] },
  { path: 'login', component: SigninComponent },
  { path: 'help', component: HelpComponent },
  { path: 'ssoerror', component: SsoFailedComponent },
  { path: '**', component: NotFoundComponent }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
