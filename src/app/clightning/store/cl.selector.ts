import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CLState } from './cl.state';

export const clState = createFeatureSelector<CLState>('cl');
export const clNodeInformation = createSelector(clState, (state: CLState) => state.information);
export const payments = createSelector(clState, (state: CLState) => ({ payments: state.payments, paymentsCallStatus: state.apisCallStatus.FetchPayments }));
