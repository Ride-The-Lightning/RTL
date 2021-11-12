import { createFeatureSelector, createSelector } from '@ngrx/store';
import { LNDState } from './lnd.state';

export const lndState = createFeatureSelector<LNDState>('lnd');
export const lndNodeInformation = createSelector(lndState, (state: LNDState) => state.information);
export const forwardingHistory = createSelector(lndState, (state: LNDState) => ({ forwardingHistory: state.forwardingHistory, apiCallStatus: state.apisCallStatus.GetForwardingHistory }));
