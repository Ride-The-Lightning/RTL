import { createFeatureSelector, createSelector } from '@ngrx/store';
import { APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { ECLState } from './ecl.state';

export const eclState = createFeatureSelector<ECLState>('ecl');
export const eclNodeSettings = createSelector(eclState, (state: ECLState) => state.nodeSettings);
export const eclNodeInformation = createSelector(eclState, (state: ECLState) => state.information);
export const nodeInfoStatus = createSelector(eclState, (state: ECLState) => ({ information: state.information, apiCallStatus: state.apisCallStatus.FetchInfo }));
export const apiCallStatusNodeInfo = createSelector(eclState, (state: ECLState) => state.apisCallStatus.FetchInfo);
export const allAPIsCallStatus = createSelector(eclState, (state: ECLState) => state.apisCallStatus);
export const payments = createSelector(eclState, (state: ECLState) => ({ payments: state.payments, apiCallStatus: state.apisCallStatus.FetchPayments }));
export const fees = createSelector(eclState, (state: ECLState) => ({ fees: state.fees, apiCallStatus: state.apisCallStatus.FetchFees }));
export const allChannelsInfo = createSelector(eclState, (state: ECLState) => ({ activeChannels: state.activeChannels, pendingChannels: state.pendingChannels, inactiveChannels: state.inactiveChannels, lightningBalance: state.lightningBalance, channelsStatus: state.channelsStatus, apiCallStatus: state.apisCallStatus.FetchChannels }));
export const transactions = createSelector(eclState, (state: ECLState) => ({ transactions: state.transactions, apiCallStatus: state.apisCallStatus.FetchTransactions }));
export const invoices = createSelector(eclState, (state: ECLState) => ({ invoices: state.invoices, apiCallStatus: state.apisCallStatus.FetchInvoices }));
export const peers = createSelector(eclState, (state: ECLState) => ({ peers: state.peers, apiCallStatus: state.apisCallStatus.FetchPeers }));
export const onchainBalance = createSelector(eclState, (state: ECLState) => ({ onchainBalance: state.onchainBalance, apiCallStatus: state.apisCallStatus.FetchOnchainBalance }));
