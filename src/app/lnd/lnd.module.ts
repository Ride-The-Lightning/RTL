import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LNDRouting } from './lnd.routing';
import { SharedModule } from '../shared/shared.module';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { PeersComponent } from './peers/peers.component';
import { SendReceiveTransComponent } from './old-transactions/send-receive/send-receive-trans.component';
import { LightningInvoicesComponent } from './transactions/invoices/lightning-invoices.component';
import { UnlockLNDComponent } from './unlock-lnd/unlock-lnd.component';
import { LightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { ChannelManageComponent } from './channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './channels/channel-pending/channel-pending.component';
import { ChannelClosedComponent } from './channels/channel-closed/channel-closed.component';
import { TransactionsComponent } from './transactions/transactions.component';
import { ListTransactionsComponent } from './old-transactions/list-transactions/list-transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { ForwardingHistoryComponent } from './switch/forwarding-history.component';
import { RoutingPeersComponent } from './routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { ChannelBackupComponent } from './channels/channel-backup/channel-backup.component';
import { ChannelRestoreComponent } from './channels/channel-restore/channel-restore.component';
import { QueryRoutesComponent } from './payments/query-routes/query-routes.component';

import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { LNDUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    LNDRouting
  ],
  declarations: [
    LNDRootComponent,
    HomeComponent,
    PeersComponent,
    SendReceiveTransComponent,
    LightningInvoicesComponent,
    UnlockLNDComponent,
    LightningPaymentsComponent,
    ChannelManageComponent,
    ChannelPendingComponent,
    ChannelClosedComponent,
    TransactionsComponent,
    ListTransactionsComponent,
    LookupsComponent,
    ForwardingHistoryComponent,
    RoutingPeersComponent,
    ChannelLookupComponent,
    NodeLookupComponent,
    ChannelBackupComponent,
    QueryRoutesComponent,
    ChannelRestoreComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    LNDUnlockedGuard
  ],
  bootstrap: [LNDRootComponent]
})
export class LNDModule {}
