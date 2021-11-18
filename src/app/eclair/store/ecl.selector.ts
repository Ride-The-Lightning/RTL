import { createFeatureSelector, createSelector } from '@ngrx/store';
import { APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { ECLState } from './ecl.state';

export const eclState = createFeatureSelector<ECLState>('ecl');
export const eclNodeSettings = createSelector(eclState, (state: ECLState) => state.nodeSettings);
export const eclNodeInformation = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchInfo : state.information));
export const allAPIsCallStatus = createSelector(eclState, (state: ECLState) => state.apisCallStatus);
export const payments = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchPayments.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchPayments : state.payments));
export const fees = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchFees : state.fees));
export const allChannelsInfo = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchChannels : { activeChannels: state.activeChannels, pendingChannels: state.pendingChannels, inactiveChannels: state.inactiveChannels, lightningBalance: state.lightningBalance, channelsStatus: state.channelsStatus }));
export const transactions = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchTransactions.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchTransactions : state.transactions));
export const invoices = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchInvoices.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchInvoices : state.invoices));
export const peers = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchPeers.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchPeers : state.peers));
export const onchainBalance = createSelector(eclState, (state: ECLState) => ((state.apisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.ERROR) ? state.apisCallStatus.FetchOnchainBalance : state.onchainBalance));
