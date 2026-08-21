import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LNDState } from './lnd.state';
import { BlockchainBalance } from '../../shared/models/lndModels';

export const lndState = createFeatureSelector<LNDState>('lnd');
export const lndPageSettings = createSelector(lndState, (state: LNDState) => ({ pageSettings: state.pageSettings, apiCallStatus: state.apisCallStatus.FetchPageSettings }));
export const lndNodeInformation = createSelector(lndState, (state: LNDState) => state.information);
export const nodeInfoStatus = createSelector(lndState, (state: LNDState) => ({ information: state.information, apiCallStatus: state.apisCallStatus.FetchInfo }));
export const allAPIsCallStatus = createSelector(lndState, (state: LNDState) => state.apisCallStatus);
export const forwardingHistory = createSelector(lndState, (state: LNDState) => ({ forwardingHistory: state.forwardingHistory, apiCallStatus: state.apisCallStatus.FetchForwardingHistory }));
export const payments = createSelector(lndState, (state: LNDState) => ({ listPayments: state.listPayments, apiCallStatus: state.apisCallStatus.FetchPayments }));
export const fees = createSelector(lndState, (state: LNDState) => ({ fees: state.fees, apiCallStatus: state.apisCallStatus.FetchFees }));
export const peers = createSelector(lndState, (state: LNDState) => ({ peers: state.peers, apiCallStatus: state.apisCallStatus.FetchPeers }));
export const transactions = createSelector(lndState, (state: LNDState) => ({ transactions: state.transactions, apiCallStatus: state.apisCallStatus.FetchTransactions }));
export const invoices = createSelector(lndState, (state: LNDState) => ({ listInvoices: state.listInvoices, apiCallStatus: state.apisCallStatus.FetchInvoices }));
export const channels = createSelector(lndState, (state: LNDState) => ({ channels: state.channels, channelsSummary: state.channelsSummary, lightningBalance: state.lightningBalance, apiCallStatus: state.apisCallStatus.FetchAllChannels }));
export const channelsSummary = createSelector(lndState, (state: LNDState) => ({ channelsSummary: state.channelsSummary, pendingChannels: state.pendingChannels, closedChannels: state.closedChannels, apiCallStatus: state.apisCallStatus.FetchAllChannels }));
export const pendingChannels = createSelector(lndState, (state: LNDState) => ({ pendingChannels: state.pendingChannels, pendingChannelsSummary: state.pendingChannelsSummary, apiCallStatus: state.apisCallStatus.FetchPendingChannels }));
export const closedChannels = createSelector(lndState, (state: LNDState) => ({ closedChannels: state.closedChannels, apiCallStatus: state.apisCallStatus.FetchClosedChannels }));
export const blockchainBalance = createSelector(lndState, (state: LNDState) => ({ blockchainBalance: state.blockchainBalance, apiCallStatus: state.apisCallStatus.FetchBalanceBlockchain }));
export const lightningBalance = createSelector(lndState, (state: LNDState) => ({ lightningBalance: state.lightningBalance, apiCallStatus: state.apisCallStatus.FetchAllChannels }));
export const utxos = createSelector(lndState, (state: LNDState) => ({ utxos: state.utxos, apiCallStatus: state.apisCallStatus.FetchUTXOs }));
export const networkInfo = createSelector(lndState, (state: LNDState) => ({ networkInfo: state.networkInfo, apiCallStatus: state.apisCallStatus.FetchNetwork }));
export const allLightningTransactions = createSelector(lndState, (state: LNDState) => ({ allLightningTransactions: state.allLightningTransactions, apiCallStatus: state.apisCallStatus.FetchLightningTransactions }));
export const allChannels = createSelector(lndState, (state: LNDState) => ({ channels: state.channels, pendingChannels: state.pendingChannels, closedChannels: state.closedChannels }));
export const nodeInfoAndAPIStatus = createSelector(lndState, (state: LNDState) => ({ information: state.information, apiCallStatus: state.apisCallStatus.FetchInfo }));

// LND's fund_max draws on the coins that meet the node's min-confs policy -- 1 by default,
// 0 only when spend_unconfirmed is set -- so unconfirmed coins count only when the user has
// asked to spend them. Either pool still includes the reserve LND holds back for anchor
// channels, so a wallet can read as funded while nothing is actually spendable.
// A necessary condition, not a sufficient one: LND also deducts the on-chain funding fee and
// applies a minimum channel size, so a positive result here can still be refused by the node.
// The node stays authoritative; this only keeps the toggle off a wallet that plainly has
// nothing to commit.
export const getSpendableBalance = (walletBalance: BlockchainBalance, spendUnconfirmed: boolean): number => {
  const usableBalance = spendUnconfirmed ? +(walletBalance?.total_balance || 0) : +(walletBalance?.confirmed_balance || 0);
  return usableBalance - +(walletBalance?.reserved_balance_anchor_chan || 0);
};
