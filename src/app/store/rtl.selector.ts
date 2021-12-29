import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RootState } from './rtl.state';

export const rootState = createFeatureSelector<RootState>('root');
export const rootAPIUrl = createSelector(rootState, (state: RootState) => state.apiURL);
export const rootSelectedNode = createSelector(rootState, (state: RootState) => state.selNode);
export const rootAppConfig = createSelector(rootState, (state: RootState) => state.appConfig);
export const rootNodeData = createSelector(rootState, (state: RootState) => state.nodeData);
export const loginStatus = createSelector(rootState, (state: RootState) => state.apisCallStatus.Login);
export const authorizedStatus = createSelector(rootState, (state: RootState) => state.apisCallStatus.IsAuthorized);
export const rootSelNodeAndNodeData = createSelector(rootState, (state: RootState) => ({ nodeDate: state.nodeData, selNode: state.selNode }));
