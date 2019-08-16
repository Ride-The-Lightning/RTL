import { Routes, RouterModule } from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { AuthGuard, LNDUnlockedGuard } from '../shared/services/auth.guard';

import { LndRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { UnlockLNDComponent } from './unlock-lnd/unlock-lnd.component';
import { ChannelClosedComponent } from './channels/channel-closed/channel-closed.component';
import { ChannelManageComponent } from './channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './channels/channel-pending/channel-pending.component';
import { PeersComponent } from './peers/peers.component';
import { SendReceiveTransComponent } from './transactions/send-receive/send-receive-trans.component';
import { ListTransactionsComponent } from './transactions/list-transactions/list-transactions.component';
import { PaymentsComponent } from './payments/send-receive/payments.component';
import { QueryRoutesComponent } from './payments/query-routes/query-routes.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { LookupsComponent } from './lookups/lookups.component';
import { ForwardingHistoryComponent } from './switch/forwarding-history.component';
import { RoutingPeersComponent } from './routing-peers/routing-peers.component';
import { ChannelBackupComponent } from './channels/channel-backup/channel-backup.component';

export const lndRoutes: Routes = [
  { path: '', redirectTo: '.', pathMatch: 'full', canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: '.', component: LndRootComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './unlocklnd', component: UnlockLNDComponent, canActivate: [AuthGuard] },
  { path: './home', component: HomeComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './peers', component: PeersComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './chnlclosed', component: ChannelClosedComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './chnlmanage', component: ChannelManageComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './chnlpending', component: ChannelPendingComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './chnlbackup', component: ChannelBackupComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './transsendreceive', component: SendReceiveTransComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './translist', component: ListTransactionsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './paymentsend', component: PaymentsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './queryroutes', component: QueryRoutesComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './invoices', component: InvoicesComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './switch', component: ForwardingHistoryComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './routingpeers', component: RoutingPeersComponent, canActivate: [AuthGuard, LNDUnlockedGuard] },
  { path: './lookups', component: LookupsComponent, canActivate: [AuthGuard, LNDUnlockedGuard] }
];

export const lndRouting: ModuleWithProviders = RouterModule.forChild(lndRoutes);
