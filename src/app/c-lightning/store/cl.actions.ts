import { Action } from '@ngrx/store';
import { GetInfo } from '../../shared/models/clModels';

export const RESET_CL_STORE = 'RESET_CL_STORE';
export const FETCH_CL_INFO = 'FETCH_CL_INFO';
export const SET_CL_INFO = 'SET_CL_INFO';
export const FETCH_CL_FEES = 'FETCH_CL_FEES';
export const SET_CL_FEES = 'SET_CL_FEES';

export class ResetCLStore implements Action {
  readonly type = RESET_CL_STORE;
}

export class FetchCLInfo implements Action {
  readonly type = FETCH_CL_INFO;
}

export class SetCLInfo implements Action {
  readonly type = SET_CL_INFO;
  constructor(public payload: GetInfo) {}
}

export class FetchCLFees implements Action {
  readonly type = FETCH_CL_FEES;
}

export class SetCLFees implements Action {
  readonly type = SET_CL_FEES;
  constructor(public payload: {}) {}
}

export type CLActions =
ResetCLStore | FetchCLInfo | SetCLInfo | FetchCLFees | SetCLFees;
