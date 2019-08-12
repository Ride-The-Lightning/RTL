import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { environment } from '../../environments/environment';
import { SharedModule } from '../shared/shared.module';
import { LNDReducer } from './store/lnd.reducers';
import { LNDEffects } from './store/lnd.effects';

import { lndRouting } from './lnd.routing';
import { LndRootComponent } from './lnd-root.component';
import { HomeComponent } from './home/home.component';
import { PeersComponent } from './peers/peers.component';
import { SendReceiveTransComponent } from './transactions/send-receive/send-receive-trans.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { ServerConfigComponent } from './server-config/server-config.component';
import { HelpComponent } from './help/help.component';
import { UnlockLNDComponent } from './unlock-lnd/unlock-lnd.component';
import { PaymentsComponent } from './payments/send-receive/payments.component';
import { ChannelManageComponent } from './channels/channel-manage/channel-manage.component';
import { ChannelPendingComponent } from './channels/channel-pending/channel-pending.component';
import { SigninComponent } from './signin/signin.component';
import { ChannelClosedComponent } from './channels/channel-closed/channel-closed.component';
import { ListTransactionsComponent } from './transactions/list-transactions/list-transactions.component';
import { LookupsComponent } from './lookups/lookups.component';
import { ForwardingHistoryComponent } from './switch/forwarding-history.component';
import { RoutingPeersComponent } from './routing-peers/routing-peers.component';
import { ChannelLookupComponent } from './lookups/channel-lookup/channel-lookup.component';
import { NodeLookupComponent } from './lookups/node-lookup/node-lookup.component';
import { ChannelBackupComponent } from './channels/channel-backup/channel-backup.component';
import { QueryRoutesComponent } from './payments/query-routes/query-routes.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    lndRouting,
    NgxChartsModule,
    EffectsModule.forFeature([LNDEffects]),
    StoreModule.forFeature('lnd', LNDReducer),
    !environment.production ? StoreDevtoolsModule.instrument() : []
  ],
  declarations: [
    LndRootComponent,
    HomeComponent,
    PeersComponent,
    SendReceiveTransComponent,
    InvoicesComponent,
    ServerConfigComponent,
    HelpComponent,
    UnlockLNDComponent,
    PaymentsComponent,
    ChannelManageComponent,
    ChannelPendingComponent,
    SigninComponent,
    ChannelClosedComponent,
    ListTransactionsComponent,
    LookupsComponent,
    ForwardingHistoryComponent,
    RoutingPeersComponent,
    ChannelLookupComponent,
    NodeLookupComponent,
    ChannelBackupComponent,
    QueryRoutesComponent
  ],
  providers: [],
  bootstrap: [LndRootComponent]
})
export class LndModule {}
