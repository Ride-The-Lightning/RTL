import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees } from '../../shared/models/eclrModels';

export const RESET_ECLR_STORE = 'RESET_ECLR_STORE';
export const CLEAR_EFFECT_ERROR = 'CLEAR_EFFECT_ERROR';
export const EFFECT_ERROR = 'EFFECT_ERROR';
export const SET_CHILD_NODE_SETTINGS = 'SET_CHILD_NODE_SETTINGS';
export const FETCH_INFO = 'FETCH_INFO';
export const SET_INFO = 'SET_INFO';
export const FETCH_FEES = 'FETCH_FEES';
export const SET_FEES = 'SET_FEES';
export const FETCH_CHANNELS = 'FETCH_CHANNELS';
export const SET_CHANNELS = 'SET_CHANNELS';
export const FETCH_CHANNEL_STATS = 'FETCH_CHANNEL_STATS';
export const SET_CHANNEL_STATS = 'SET_CHANNEL_STATS';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR;
  constructor(public payload: string) { } // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR;
  constructor(public payload: ErrorPayload) { }
}

export class ResetECLRStore implements Action {
  readonly type = RESET_ECLR_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfoECLR implements Action {
  readonly type = FETCH_INFO;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfo implements Action {
  readonly type = SET_INFO;
  constructor(public payload: GetInfo) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES;
}

export class SetFees implements Action {
  readonly type = SET_FEES;
  constructor(public payload: Fees) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS;
}

export class SetChannels implements Action {
  readonly type = SET_CHANNELS;
  constructor(public payload: Channel[]) {}
}

export class FetchChannelStats implements Action {
  readonly type = FETCH_CHANNEL_STATS;
}

export class SetChannelStats implements Action {
  readonly type = SET_CHANNEL_STATS;
  constructor(public payload: ChannelStats) {}
}

export type ECLRActions = ResetECLRStore | ClearEffectError | EffectError | SetChildNodeSettings |
  FetchInfoECLR | SetInfo | FetchFees | SetFees | FetchChannels | SetChannels | FetchChannelStats | SetChannelStats;
