import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { scan } from 'rxjs/operators';

import { LNDState } from './lnd.state';
import { GetInfo } from '../../shared/models/lndModels';

export const getLNDState = createFeatureSelector<LNDState>('lnd');
export const getInformation = createSelector(getLNDState, (state: LNDState) => state.information);
export const takeLastGetInfo = (count: number) => pipe(select(getInformation), scan((acc, curr) => [curr, ...acc].filter((val, index) => index < count && val.hasOwnProperty('identity_pubkey')), [] as GetInfo[]));
export const getForwardingHistory = createSelector(getLNDState, (state: LNDState) => state.forwardingHistory);
export const getForwardingHistoryAPIStatus = createSelector(getLNDState, (state: LNDState) => state.apisCallStatus.GetForwardingHistory);
export const forwardingHistoryAndAPIStatus = createSelector(getLNDState, (state: LNDState) => ({ forwardingHistory: state.forwardingHistory, apisCallStatus: state.apisCallStatus.GetForwardingHistory }));
