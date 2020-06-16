import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, Peer, LightningBalance, OnChainBalance, ChannelsStatus } from '../../shared/models/eclrModels';

export const RESET_ECLR_STORE = 'RESET_ECLR_STORE';
export const CLEAR_EFFECT_ERROR_ECLR = 'CLEAR_EFFECT_ERROR_ECLR';
export const EFFECT_ERROR_ECLR = 'EFFECT_ERROR_ECLR';
export const SET_CHILD_NODE_SETTINGS_ECLR = 'SET_CHILD_NODE_SETTINGS_ECLR';
export const FETCH_INFO_ECLR = 'FETCH_INFO_ECLR';
export const SET_INFO_ECLR = 'SET_INFO_ECLR';
export const FETCH_FEES_ECLR = 'FETCH_FEES_ECLR';
export const SET_FEES_ECLR = 'SET_FEES_ECLR';
export const FETCH_CHANNELS_ECLR = 'FETCH_CHANNELS_ECLR';
export const SET_ACTIVE_CHANNELS_ECLR = 'SET_ACTIVE_CHANNELS_ECLR';
export const SET_PENDING_CHANNELS_ECLR = 'SET_PENDING_CHANNELS_ECLR';
export const SET_INACTIVE_CHANNELS_ECLR = 'SET_INACTIVE_CHANNELS_ECLR';
export const FETCH_CHANNEL_STATS_ECLR = 'FETCH_CHANNEL_STATS_ECLR';
export const SET_CHANNEL_STATS_ECLR = 'SET_CHANNEL_STATS_ECLR';
export const FETCH_ONCHAIN_BALANCE_ECLR = 'FETCH_ONCHAIN_BALANCE_ECLR';
export const SET_ONCHAIN_BALANCE_ECLR = 'SET_ONCHAIN_BALANCE_ECLR';
export const FETCH_LIGHTNING_BALANCE_ECLR = 'FETCH_LIGHTNING_BALANCE_ECLR';
export const SET_LIGHTNING_BALANCE_ECLR = 'SET_LIGHTNING_BALANCE_ECLR';
export const SET_CHANNELS_STATUS_ECLR = 'SET_CHANNELS_STATUS_ECLR';
export const FETCH_PEERS_ECLR = 'FETCH_PEERS_ECLR';
export const SET_PEERS_ECLR = 'SET_PEERS_ECLR';


export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR_ECLR;
  constructor(public payload: string) { } // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR_ECLR;
  constructor(public payload: ErrorPayload) { }
}

export class ResetECLRStore implements Action {
  readonly type = RESET_ECLR_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS_ECLR;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO_ECLR;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfo implements Action {
  readonly type = SET_INFO_ECLR;
  constructor(public payload: GetInfo) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES_ECLR;
}

export class SetFees implements Action {
  readonly type = SET_FEES_ECLR;
  constructor(public payload: Fees) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS_ECLR;
}

export class SetActiveChannels implements Action {
  readonly type = SET_ACTIVE_CHANNELS_ECLR;
  constructor(public payload: Channel[]) {}
}

export class SetPendingChannels implements Action {
  readonly type = SET_PENDING_CHANNELS_ECLR;
  constructor(public payload: Channel[]) {}
}

export class SetInactiveChannels implements Action {
  readonly type = SET_INACTIVE_CHANNELS_ECLR;
  constructor(public payload: Channel[]) {}
}

export class FetchChannelStats implements Action {
  readonly type = FETCH_CHANNEL_STATS_ECLR;
}

export class SetChannelStats implements Action {
  readonly type = SET_CHANNEL_STATS_ECLR;
  constructor(public payload: ChannelStats[]) {}
}

export class FetchOnchainBalance implements Action {
  readonly type = FETCH_ONCHAIN_BALANCE_ECLR;
}

export class SetOnchainBalance implements Action {
  readonly type = SET_ONCHAIN_BALANCE_ECLR;
  constructor(public payload: OnChainBalance) {}
}

export class SetLightningBalance implements Action {
  readonly type = SET_LIGHTNING_BALANCE_ECLR;
  constructor(public payload: LightningBalance) {}
}

export class SetChannelsStatus implements Action {
  readonly type = SET_CHANNELS_STATUS_ECLR;
  constructor(public payload: ChannelsStatus) {}
}

export class FetchPeers implements Action {
  readonly type = FETCH_PEERS_ECLR;
}

export class SetPeers implements Action {
  readonly type = SET_PEERS_ECLR;
  constructor(public payload: Peer[]) {}
}

export type ECLRActions = ResetECLRStore | ClearEffectError | EffectError | SetChildNodeSettings |
  FetchInfo | SetInfo | FetchFees | SetFees | FetchChannels | SetActiveChannels | SetPendingChannels | SetInactiveChannels |
  SetChannelsStatus | FetchChannelStats | SetChannelStats |
  FetchOnchainBalance | SetOnchainBalance | SetLightningBalance | FetchPeers | SetPeers;
