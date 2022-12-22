import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ECLState } from './ecl.state';

export const eclState = createFeatureSelector<ECLState>('ecl');
export const eclNodeSettings = createSelector(eclState, (state: ECLState) => state.nodeSettings);
export const eclPageSettings = createSelector(eclState, (state: ECLState) => ({ pageSettings: state.pageSettings, apiCallStatus: state.apisCallStatus.FetchPageSettings }));
export const eclNodeInformation = createSelector(eclState, (state: ECLState) => state.information);
export const nodeInfoStatus = createSelector(eclState, (state: ECLState) => ({ information: state.information, apiCallStatus: state.apisCallStatus.FetchInfo }));
export const apiCallStatusNodeInfo = createSelector(eclState, (state: ECLState) => state.apisCallStatus.FetchInfo);
export const allAPIsCallStatus = createSelector(eclState, (state: ECLState) => state.apisCallStatus);
export const payments = createSelector(eclState, (state: ECLState) => ({ payments: state.payments, apiCallStatus: state.apisCallStatus.FetchPayments }));
export const fees = createSelector(eclState, (state: ECLState) => ({ fees: state.fees, apiCallStatus: state.apisCallStatus.FetchFees }));
export const activeChannelsInfo = createSelector(eclState, (state: ECLState) => ({ activeChannels: state.activeChannels, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const pendingChannelsInfo = createSelector(eclState, (state: ECLState) => ({ pendingChannels: state.pendingChannels, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const inactiveChannelsInfo = createSelector(eclState, (state: ECLState) => ({ inactiveChannels: state.inactiveChannels, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const allChannelsInfo = createSelector(eclState, (state: ECLState) => ({ activeChannels: state.activeChannels, pendingChannels: state.pendingChannels, inactiveChannels: state.inactiveChannels,
  lightningBalance: state.lightningBalance, channelsStatus: state.channelsStatus, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const transactions = createSelector(eclState, (state: ECLState) => ({ transactions: state.transactions, apiCallStatus: state.apisCallStatus.FetchTransactions }));
export const invoices = createSelector(eclState, (state: ECLState) => ({ invoices: state.invoices, apiCallStatus: state.apisCallStatus.FetchInvoices }));
export const peers = createSelector(eclState, (state: ECLState) => ({ peers: state.peers, apiCallStatus: state.apisCallStatus.FetchPeers }));
export const onchainBalance = createSelector(eclState, (state: ECLState) => ({ onchainBalance: state.onchainBalance, apiCallStatus: state.apisCallStatus.FetchOnchainBalance }));
