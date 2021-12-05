import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CLState } from './cl.state';

export const clState = createFeatureSelector<CLState>('cl');
export const clNodeSettings = createSelector(clState, (state: CLState) => state.nodeSettings);
export const clNodeInformation = createSelector(clState, (state: CLState) => state.information);
export const apiCallStatusNodeInfo = createSelector(clState, (state: CLState) => state.apisCallStatus.FetchInfo);
export const allAPIsCallStatus = createSelector(clState, (state: CLState) => state.apisCallStatus);
export const payments = createSelector(clState, (state: CLState) => ({ payments: state.payments, apiCallStatus: state.apisCallStatus.FetchPayments }));
export const peers = createSelector(clState, (state: CLState) => ({ peers: state.peers, apiCallStatus: state.apisCallStatus.FetchPeers }));
export const fees = createSelector(clState, (state: CLState) => ({ fees: state.fees, apiCallStatus: state.apisCallStatus.FetchFees }));
export const feeRatesPerKB = createSelector(clState, (state: CLState) => ({ feeRatesPerKB: state.feeRatesPerKB, apiCallStatus: state.apisCallStatus.FetchFeeRatesperkb }));
export const feeRatesPerKW = createSelector(clState, (state: CLState) => ({ feeRatesPerKW: state.feeRatesPerKW, apiCallStatus: state.apisCallStatus.FetchFeeRatesperkw }));
export const listInvoices = createSelector(clState, (state: CLState) => ({ listInvoices: state.invoices, apiCallStatus: state.apisCallStatus.FetchInvoices }));
export const utxos = createSelector(clState, (state: CLState) => ({ utxos: state.utxos, apiCallStatus: state.apisCallStatus.FetchUTXOs }));
export const channels = createSelector(clState, (state: CLState) => ({ activeChannels: state.activeChannels, pendingChannels: state.pendingChannels, inactiveChannels: state.inactiveChannels, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const balance = createSelector(clState, (state: CLState) => ({ balance: state.balance, apiCallStatus: state.apisCallStatus.FetchBalance }));
export const localRemoteBalance = createSelector(clState, (state: CLState) => ({ localRemoteBalance: state.localRemoteBalance, apiCallStatus: state.apisCallStatus.FetchLocalRemoteBalance }));
export const forwardingHistory = createSelector(clState, (state: CLState) => ({ forwardingHistory: state.forwardingHistory, apiCallStatus: state.apisCallStatus.FetchForwardingHistory }));
export const failedForwardingHistory = createSelector(clState, (state: CLState) => ({ failedForwardingHistory: state.failedForwardingHistory, apiCallStatus: state.apisCallStatus.FetchFailedForwardingHistory }));
export const nodeInfoAndNodeSettingsAndBalance = createSelector(clState, (state: CLState) => ({ information: state.information, nodeSettings: state.nodeSettings, balance: state.balance }));
export const nodeInfoAndBalanceAndNumPeers = createSelector(clState, (state: CLState) => ({ information: state.information, balance: state.balance, numPeers: state.peers.length }));
export const nodeInfoAndBalance = createSelector(clState, (state: CLState) => ({ information: state.information, balance: state.balance }));
export const nodeInfoAndNodeSettingsAndAPIsStatus = createSelector(clState, (state: CLState) => ({ information: state.information, nodeSettings: state.nodeSettings, apisCallStatus: [state.apisCallStatus.FetchInfo, state.apisCallStatus.FetchForwardingHistory] }));
export const offers = createSelector(clState, (state: CLState) => ({ offers: state.offers, apiCallStatus: state.apisCallStatus.FetchOffers }));
