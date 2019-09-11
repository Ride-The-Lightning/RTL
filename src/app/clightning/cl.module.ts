import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CLRouting } from './cl.routing';
import { SharedModule } from '../shared/shared.module';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLFeeRatesComponent } from './home/fee-rates/fee-rates.component';
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

import { CommonService } from '../shared/services/common.service';
import { LoggerService, ConsoleLoggerService } from '../shared/services/logger.service';
import { CLUnlockedGuard } from '../shared/services/auth.guard';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CLRouting
  ],
  declarations: [
    CLRootComponent,
    CLHomeComponent,
    CLChannelsComponent,
    CLInvoicesComponent,
    CLLookupsComponent,
    CLChannelLookupComponent,
    CLNodeLookupComponent,
    CLOnChainComponent,
    CLQueryRoutesComponent,
    CLPaymentsComponent,
    CLPeersComponent,
    CLForwardingHistoryComponent,
    CLFeeRatesComponent
  ],
  providers: [
    { provide: LoggerService, useClass: ConsoleLoggerService },
    CLUnlockedGuard,
    CommonService
  ],
  bootstrap: [CLRootComponent]
})
export class CLModule {}
