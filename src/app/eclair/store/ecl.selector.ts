import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { scan } from 'rxjs/operators';

import { GetInfo } from '../../shared/models/eclModels';
import { ECLState } from './ecl.state';

export const getECLState = createFeatureSelector<ECLState>('ecl');
export const getInformation = createSelector(getECLState, (state: ECLState) => state.information);
export const takeLastGetInfo = (count: number) => pipe(select(getInformation), scan((acc, curr) => [curr, ...acc].filter((val, index) => index < count && val.hasOwnProperty('identity_pubkey')), [] as GetInfo[]));
export const getReceivedPayments = createSelector(getECLState, (state: ECLState) => state.payments.received);
export const getSentPayments = createSelector(getECLState, (state: ECLState) => state.payments.sent);
export const getRelayedPayments = createSelector(getECLState, (state: ECLState) => state.payments.relayed);
export const getPaymentAPIStatus = createSelector(getECLState, (state: ECLState) => state.apisCallStatus.FetchPayments);
export const relayedPaymentAndAPIStatus = createSelector(getECLState, (state: ECLState) => ({ relayed: state.payments.relayed, apisCallStatus: state.apisCallStatus.FetchPayments }));
