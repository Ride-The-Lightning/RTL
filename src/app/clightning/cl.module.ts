import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CLRouting } from './cl.routing';
import { SharedModule } from '../shared/shared.module';

import { CLRootComponent } from './cl-root.component';
import { CLHomeComponent } from './home/home.component';
import { CLConnectionsComponent } from './peers-channels/connections.component';
import { CLChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { CLPeersComponent } from './peers-channels/peers/peers.component';
import { CLLightningInvoicesTableComponent } from './transactions/invoices/invoices-table/lightning-invoices-table.component';
import { CLOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { CLUTXOTablesComponent } from './on-chain/utxo-tables/utxo-tables.component';
import { CLOnChainUtxosComponent } from './on-chain/utxo-tables/utxos/utxos.component';
import { CLOnChainComponent } from './on-chain/on-chain.component';
import { CLLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { CLTransactionsComponent } from './transactions/transactions.component';
import { CLLookupsComponent } from './graph/lookups/lookups.component';
import { CLRoutingComponent } from './routing/routing.component';
import { CLForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { CLFailedTransactionsComponent } from './routing/failed-transactions/failed-transactions.component';
import { CLLocalFailedTransactionsComponent } from './routing/local-failed-transactions/local-failed-transactions.component';
import { CLRoutingPeersComponent } from './routing/routing-peers/routing-peers.component';
import { CLChannelLookupComponent } from './graph/lookups/channel-lookup/channel-lookup.component';
import { CLNodeLookupComponent } from './graph/lookups/node-lookup/node-lookup.component';
import { CLQueryRoutesComponent } from './graph/query-routes/query-routes.component';
import { CLGraphComponent } from './graph/graph.component';
import { CLChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { CLChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { CLBumpFeeComponent } from './peers-channels/channels/bump-fee-modal/bump-fee.component';
import { CLNodeInfoComponent } from './home/node-info/node-info.component';
import { CLBalancesInfoComponent } from './home/balances-info/balances-info.component';
import { CLFeeInfoComponent } from './home/fee-info/fee-info.component';
import { CLChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { CLChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { CLChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';
import { CLNetworkInfoComponent } from './network-info/network-info.component';
import { CLFeeRatesComponent } from './network-info/fee-rates/fee-rates.component';
import { CLOnChainFeeEstimatesComponent } from './network-info/on-chain-fee-estimates/on-chain-fee-estimates.component';
import { CLSignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { CLSignComponent } from './sign-verify-message/sign/sign.component';
import { CLVerifyComponent } from './sign-verify-message/verify/verify.component';
import { CLReportsComponent } from './reports/reports.component';
import { CLFeeReportComponent } from './reports/fee/fee-report.component';
import { CLTransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { CLOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { CLOpenChannelComponent } from './peers-channels/channels/open-channel-modal/open-channel.component';
import { CLChannelInformationComponent } from './peers-channels/channels/channel-information-modal/channel-information.component';
import { CLInvoiceInformationComponent } from './transactions/invoices/invoice-information-modal/invoice-information.component';
import { CLConnectPeerComponent } from './peers-channels/connect-peer/connect-peer.component';
import { CLLightningSendPaymentsComponent } from './transactions/send-payment-modal/send-payment.component';
import { CLCreateInvoiceComponent } from './transactions/invoices/create-invoice-modal/create-invoice.component';
import { CLOnChainSendModalComponent } from './on-chain/on-chain-send-modal/on-chain-send-modal.component';
import { CLCreateOfferComponent } from './transactions/offers/create-offer-modal/create-offer.component';
import { CLOfferInformationComponent } from './transactions/offers/offer-information-modal/offer-information.component';
import { CLOffersTableComponent } from './transactions/offers/offers-table/offers-table.component';
import { CLOfferBookmarksTableComponent } from './transactions/offers/offer-bookmarks-table/offer-bookmarks-table.component';

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
    CLPeersComponent,
    CLConnectionsComponent,
    CLLightningInvoicesTableComponent,
    CLLightningPaymentsComponent,
    CLTransactionsComponent,
    CLLookupsComponent,
    CLRoutingComponent,
    CLForwardingHistoryComponent,
    CLFailedTransactionsComponent,
    CLLocalFailedTransactionsComponent,
    CLRoutingPeersComponent,
    CLChannelLookupComponent,
    CLNodeLookupComponent,
    CLQueryRoutesComponent,
    CLGraphComponent,
    CLOnChainReceiveComponent,
    CLUTXOTablesComponent,
    CLOnChainUtxosComponent,
    CLOnChainComponent,
    CLChannelsTablesComponent,
    CLChannelOpenTableComponent,
    CLChannelPendingTableComponent,
    CLBumpFeeComponent,
    CLNodeInfoComponent,
    CLBalancesInfoComponent,
    CLFeeInfoComponent,
    CLChannelStatusInfoComponent,
    CLChannelCapacityInfoComponent,
    CLChannelLiquidityInfoComponent,
    CLNetworkInfoComponent,
    CLFeeRatesComponent,
    CLOnChainFeeEstimatesComponent,
    CLSignVerifyMessageComponent,
    CLSignComponent,
    CLVerifyComponent,
    CLReportsComponent,
    CLFeeReportComponent,
    CLTransactionsReportComponent,
    CLOnChainSendComponent,
    CLInvoiceInformationComponent,
    CLOpenChannelComponent,
    CLConnectPeerComponent,
    CLLightningSendPaymentsComponent,
    CLCreateInvoiceComponent,
    CLOnChainSendModalComponent,
    CLChannelInformationComponent,
    CLCreateOfferComponent,
    CLOfferInformationComponent,
    CLOffersTableComponent,
    CLOfferBookmarksTableComponent
  ],
  providers: [
    CLUnlockedGuard
  ],
  bootstrap: [CLRootComponent]
})
export class CLModule { }
