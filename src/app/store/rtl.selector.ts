import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RTLState } from './rtl.state';

export const getRTLState = createFeatureSelector<RTLState>('rtl');
export const getApiUrl = createSelector(getRTLState, (state: RTLState) => state.root.apiURL);

