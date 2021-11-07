import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { scan } from 'rxjs/operators';

import { GetInfo } from '../../shared/models/clModels';
import { CLState } from './cl.state';

export const getCLState = createFeatureSelector<CLState>('cl');
export const getInformation = createSelector(getCLState, (state: CLState) => state.information);
export const takeLastGetInfo = (count: number) => pipe(select(getInformation), scan((acc, curr) => [curr, ...acc].filter((val, index) => index < count && val.hasOwnProperty('identity_pubkey')), [] as GetInfo[]));
export const getPaymentAPIStatus = createSelector(getCLState, (state: CLState) => state.apisCallStatus.FetchPayments);
