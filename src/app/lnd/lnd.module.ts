import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LNDRouting } from './lnd.routing';
import { SharedModule } from '../shared/shared.module';

import { LNDRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { PeersComponent } from './peers/peers.component';
import { SendReceiveTransComponent } from './transactions/send-receive/send-receive-trans.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { UnlockLNDComponent } from './unlock-lnd/unlock-lnd.component';
import { PaymentsComponent } from './payments/send-receive/payments.component';
import { ChannelManageComponent } from './channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './channels/channel-pending/channel-pending.component';
import { ChannelClosedComponent } from './channels/channel-closed/channel-closed.component';
import { ListTransactionsComponent } from './transactions/list-transactions/list-transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { ForwardingHistoryComponent } from './switch/forwarding-history.component';
import { RoutingPeersComponent } from './routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { ChannelBackupComponent } from './channels/channel-backup/channel-backup.component';
import { ChannelRestoreComponent } from './channels/channel-restore/channel-restore.component';
import { QueryRoutesComponent } from './payments/query-routes/query-routes.component';

import { CommonService } from '../shared/services/common.service';
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
    InvoicesComponent,
    UnlockLNDComponent,
    PaymentsComponent,
    ChannelManageComponent,
    ChannelPendingComponent,
    ChannelClosedComponent,
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
    LNDUnlockedGuard,
    CommonService
  ],
  bootstrap: [LNDRootComponent]
})
export class LNDModule {}
