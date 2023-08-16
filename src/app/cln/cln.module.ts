import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CLNRouting } from './cln.routing';
import { SharedModule } from '../shared/shared.module';

import { CLNRootComponent } from './cln-root.component';
import { CLNHomeComponent } from './home/home.component';
import { CLNConnectionsComponent } from './peers-channels/connections.component';
import { CLNChannelsTablesComponent } from './peers-channels/channels/channels-tables/channels-tables.component';
import { CLNPeersComponent } from './peers-channels/peers/peers.component';
import { CLNLightningInvoicesTableComponent } from './transactions/invoices/invoices-table/lightning-invoices-table.component';
import { CLNOnChainReceiveComponent } from './on-chain/on-chain-receive/on-chain-receive.component';
import { CLNUTXOTablesComponent } from './on-chain/utxo-tables/utxo-tables.component';
import { CLNOnChainUtxosComponent } from './on-chain/utxo-tables/utxos/utxos.component';
import { CLNOnChainComponent } from './on-chain/on-chain.component';
import { CLNLightningPaymentsComponent } from './transactions/payments/lightning-payments.component';
import { CLNTransactionsComponent } from './transactions/transactions.component';
import { CLNLookupsComponent } from './graph/lookups/lookups.component';
import { CLNRoutingComponent } from './routing/routing.component';
import { CLNForwardingHistoryComponent } from './routing/forwarding-history/forwarding-history.component';
import { CLNFailedTransactionsComponent } from './routing/failed-transactions/failed-transactions.component';
import { CLNLocalFailedTransactionsComponent } from './routing/local-failed-transactions/local-failed-transactions.component';
import { CLNRoutingPeersComponent } from './routing/routing-peers/routing-peers.component';
import { CLNChannelLookupComponent } from './graph/lookups/channel-lookup/channel-lookup.component';
import { CLNNodeLookupComponent } from './graph/lookups/node-lookup/node-lookup.component';
import { CLNQueryRoutesComponent } from './graph/query-routes/query-routes.component';
import { CLNGraphComponent } from './graph/graph.component';
import { CLNChannelOpenTableComponent } from './peers-channels/channels/channels-tables/channel-open-table/channel-open-table.component';
import { CLNChannelPendingTableComponent } from './peers-channels/channels/channels-tables/channel-pending-table/channel-pending-table.component';
import { CLNBumpFeeComponent } from './peers-channels/channels/bump-fee-modal/bump-fee.component';
import { CLNNodeInfoComponent } from './home/node-info/node-info.component';
import { CLNBalancesInfoComponent } from './home/balances-info/balances-info.component';
import { CLNFeeInfoComponent } from './home/fee-info/fee-info.component';
import { CLNChannelStatusInfoComponent } from './home/channel-status-info/channel-status-info.component';
import { CLNChannelCapacityInfoComponent } from './home/channel-capacity-info/channel-capacity-info.component';
import { CLNChannelLiquidityInfoComponent } from './home/channel-liquidity-info/channel-liquidity-info.component';
import { CLNNetworkInfoComponent } from './network-info/network-info.component';
import { CLNFeeRatesComponent } from './network-info/fee-rates/fee-rates.component';
import { CLNOnChainFeeEstimatesComponent } from './network-info/on-chain-fee-estimates/on-chain-fee-estimates.component';
import { CLNSignVerifyMessageComponent } from './sign-verify-message/sign-verify-message.component';
import { CLNSignComponent } from './sign-verify-message/sign/sign.component';
import { CLNVerifyComponent } from './sign-verify-message/verify/verify.component';
import { CLNReportsComponent } from './reports/reports.component';
import { CLNRoutingReportComponent } from './reports/routing/routing-report.component';
import { CLNTransactionsReportComponent } from './reports/transactions/transactions-report.component';
import { CLNOnChainSendComponent } from './on-chain/on-chain-send/on-chain-send.component';
import { CLNOpenChannelComponent } from './peers-channels/channels/open-channel-modal/open-channel.component';
import { CLNChannelInformationComponent } from './peers-channels/channels/channel-information-modal/channel-information.component';
import { CLNInvoiceInformationComponent } from './transactions/invoices/invoice-information-modal/invoice-information.component';
import { CLNConnectPeerComponent } from './peers-channels/connect-peer/connect-peer.component';
import { CLNLightningSendPaymentsComponent } from './transactions/send-payment-modal/send-payment.component';
import { CLNCreateInvoiceComponent } from './transactions/invoices/create-invoice-modal/create-invoice.component';
import { CLNOnChainSendModalComponent } from './on-chain/on-chain-send-modal/on-chain-send-modal.component';
import { CLNCreateOfferComponent } from './transactions/offers/create-offer-modal/create-offer.component';
import { CLNOfferInformationComponent } from './transactions/offers/offer-information-modal/offer-information.component';
import { CLNOffersTableComponent } from './transactions/offers/offers-table/offers-table.component';
import { CLNOfferBookmarksTableComponent } from './transactions/offers/offer-bookmarks-table/offer-bookmarks-table.component';
import { CLNLiquidityAdsListComponent } from './liquidity-ads/liquidity-ads-list/liquidity-ads-list.component';
import { CLNOpenLiquidityChannelComponent } from './liquidity-ads/open-liquidity-channel-modal/open-liquidity-channel-modal.component';
import { CLNChannelActiveHTLCsTableComponent } from './peers-channels/channels/channels-tables/channel-active-htlcs-table/channel-active-htlcs-table.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    CLNRouting
  ],
  declarations: [
    CLNRootComponent,
    CLNHomeComponent,
    CLNPeersComponent,
    CLNConnectionsComponent,
    CLNLightningInvoicesTableComponent,
    CLNLightningPaymentsComponent,
    CLNTransactionsComponent,
    CLNLookupsComponent,
    CLNRoutingComponent,
    CLNForwardingHistoryComponent,
    CLNFailedTransactionsComponent,
    CLNLocalFailedTransactionsComponent,
    CLNRoutingPeersComponent,
    CLNChannelLookupComponent,
    CLNNodeLookupComponent,
    CLNQueryRoutesComponent,
    CLNGraphComponent,
    CLNOnChainReceiveComponent,
    CLNUTXOTablesComponent,
    CLNOnChainUtxosComponent,
    CLNOnChainComponent,
    CLNChannelsTablesComponent,
    CLNChannelOpenTableComponent,
    CLNChannelPendingTableComponent,
    CLNBumpFeeComponent,
    CLNNodeInfoComponent,
    CLNBalancesInfoComponent,
    CLNFeeInfoComponent,
    CLNChannelStatusInfoComponent,
    CLNChannelCapacityInfoComponent,
    CLNChannelLiquidityInfoComponent,
    CLNNetworkInfoComponent,
    CLNFeeRatesComponent,
    CLNOnChainFeeEstimatesComponent,
    CLNSignVerifyMessageComponent,
    CLNSignComponent,
    CLNVerifyComponent,
    CLNReportsComponent,
    CLNRoutingReportComponent,
    CLNTransactionsReportComponent,
    CLNOnChainSendComponent,
    CLNInvoiceInformationComponent,
    CLNOpenChannelComponent,
    CLNConnectPeerComponent,
    CLNLightningSendPaymentsComponent,
    CLNCreateInvoiceComponent,
    CLNOnChainSendModalComponent,
    CLNChannelInformationComponent,
    CLNCreateOfferComponent,
    CLNOfferInformationComponent,
    CLNOffersTableComponent,
    CLNOfferBookmarksTableComponent,
    CLNLiquidityAdsListComponent,
    CLNOpenLiquidityChannelComponent,
    CLNChannelActiveHTLCsTableComponent
  ],
  providers: [],
  bootstrap: [CLNRootComponent]
})
export class CLNModule { }
