import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, Peer, LightningBalance, OnChainBalance, ChannelsStatus, Payments, Route, PayRequest, Transaction, SendPaymentOnChain, Invoice } from '../../shared/models/eclModels';

export const RESET_ECL_STORE = 'RESET_ECL_STORE';
export const CLEAR_EFFECT_ERROR_ECL = 'CLEAR_EFFECT_ERROR_ECL';
export const EFFECT_ERROR_ECL = 'EFFECT_ERROR_ECL';
export const SET_CHILD_NODE_SETTINGS_ECL = 'SET_CHILD_NODE_SETTINGS_ECL';
export const FETCH_INFO_ECL = 'FETCH_INFO_ECL';
export const SET_INFO_ECL = 'SET_INFO_ECL';
export const FETCH_FEES_ECL = 'FETCH_FEES_ECL';
export const SET_FEES_ECL = 'SET_FEES_ECL';
export const FETCH_CHANNELS_ECL = 'FETCH_CHANNELS_ECL';
export const SET_ACTIVE_CHANNELS_ECL = 'SET_ACTIVE_CHANNELS_ECL';
export const SET_PENDING_CHANNELS_ECL = 'SET_PENDING_CHANNELS_ECL';
export const SET_INACTIVE_CHANNELS_ECL = 'SET_INACTIVE_CHANNELS_ECL';
export const FETCH_CHANNEL_STATS_ECL = 'FETCH_CHANNEL_STATS_ECL';
export const SET_CHANNEL_STATS_ECL = 'SET_CHANNEL_STATS_ECL';
export const FETCH_ONCHAIN_BALANCE_ECL = 'FETCH_ONCHAIN_BALANCE_ECL';
export const SET_ONCHAIN_BALANCE_ECL = 'SET_ONCHAIN_BALANCE_ECL';
export const FETCH_LIGHTNING_BALANCE_ECL = 'FETCH_LIGHTNING_BALANCE_ECL';
export const SET_LIGHTNING_BALANCE_ECL = 'SET_LIGHTNING_BALANCE_ECL';
export const SET_CHANNELS_STATUS_ECL = 'SET_CHANNELS_STATUS_ECL';
export const FETCH_PEERS_ECL = 'FETCH_PEERS_ECL';
export const SET_PEERS_ECL = 'SET_PEERS_ECL';
export const SAVE_NEW_PEER_ECL = 'SAVE_NEW_PEER_ECL';
export const NEWLY_ADDED_PEER_ECL = 'NEWLY_ADDED_PEER_ECL';
export const ADD_PEER_ECL = 'ADD_PEER_ECL';
export const DETACH_PEER_ECL = 'DETACH_PEER_ECL';
export const REMOVE_PEER_ECL = 'REMOVE_PEER_ECL';
export const GET_NEW_ADDRESS_ECL = 'GET_NEW_ADDRESS_ECL';
export const SET_NEW_ADDRESS_ECL = 'SET_NEW_ADDRESS_ECL';
export const SAVE_NEW_CHANNEL_ECL = 'SAVE_NEW_CHANNEL_ECL';
export const UPDATE_CHANNELS_ECL = 'UPDATE_CHANNELS_ECL';
export const CLOSE_CHANNEL_ECL = 'CLOSE_CHANNEL_ECL';
export const REMOVE_CHANNEL_ECL = 'REMOVE_CHANNEL_ECL';
export const FETCH_PAYMENTS_ECL = 'FETCH_PAYMENTS_ECL';
export const SET_PAYMENTS_ECL = 'SET_PAYMENTS_ECL';
export const GET_QUERY_ROUTES_ECL = 'GET_QUERY_ROUTES_ECL';
export const SET_QUERY_ROUTES_ECL = 'SET_QUERY_ROUTES_ECL';
export const SEND_PAYMENT_ECL = 'SEND_PAYMENT_ECL';
export const SEND_PAYMENT_STATUS_ECL = 'SEND_PAYMENT_STATUS_ECL';
export const FETCH_TRANSACTIONS_ECL = 'FETCH_TRANSACTIONS_ECL';
export const SET_TRANSACTIONS_ECL = 'SET_TRANSACTIONS_ECL';
export const SEND_ONCHAIN_FUNDS_ECL = 'SEND_ONCHAIN_FUNDS_ECL';
export const SEND_ONCHAIN_FUNDS_RES_ECL = 'SEND_ONCHAIN_FUNDS_RES_ECL';
export const FETCH_INVOICES_ECL = 'FETCH_INVOICES_ECL';
export const SET_INVOICES_ECL = 'SET_INVOICES_ECL';
export const SET_TOTAL_INVOICES_ECL = 'SET_TOTAL_INVOICES_ECL';
export const CREATE_INVOICE_ECL = 'CREATE_INVOICE_ECL';
export const ADD_INVOICE_ECL = 'ADD_INVOICE_ECL';
export const PEER_LOOKUP_ECL = 'PEER_LOOKUP_ECL';
export const SET_LOOKUP_ECL = 'SET_LOOKUP_ECL';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR_ECL;
  constructor(public payload: string) { } // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR_ECL;
  constructor(public payload: ErrorPayload) { }
}

export class ResetECLStore implements Action {
  readonly type = RESET_ECL_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS_ECL;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO_ECL;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfo implements Action {
  readonly type = SET_INFO_ECL;
  constructor(public payload: GetInfo) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES_ECL;
}

export class SetFees implements Action {
  readonly type = SET_FEES_ECL;
  constructor(public payload: Fees) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS_ECL;
  constructor(public payload: {fetchPayments: boolean}) {}  
}

export class SetActiveChannels implements Action {
  readonly type = SET_ACTIVE_CHANNELS_ECL;
  constructor(public payload: Channel[]) {}
}

export class SetPendingChannels implements Action {
  readonly type = SET_PENDING_CHANNELS_ECL;
  constructor(public payload: Channel[]) {}
}

export class SetInactiveChannels implements Action {
  readonly type = SET_INACTIVE_CHANNELS_ECL;
  constructor(public payload: Channel[]) {}
}

export class FetchChannelStats implements Action {
  readonly type = FETCH_CHANNEL_STATS_ECL;
}

export class SetChannelStats implements Action {
  readonly type = SET_CHANNEL_STATS_ECL;
  constructor(public payload: ChannelStats[]) {}
}

export class FetchOnchainBalance implements Action {
  readonly type = FETCH_ONCHAIN_BALANCE_ECL;
}

export class SetOnchainBalance implements Action {
  readonly type = SET_ONCHAIN_BALANCE_ECL;
  constructor(public payload: OnChainBalance) {}
}

export class SetLightningBalance implements Action {
  readonly type = SET_LIGHTNING_BALANCE_ECL;
  constructor(public payload: LightningBalance) {}
}

export class SetChannelsStatus implements Action {
  readonly type = SET_CHANNELS_STATUS_ECL;
  constructor(public payload: ChannelsStatus) {}
}

export class FetchPeers implements Action {
  readonly type = FETCH_PEERS_ECL;
}

export class SetPeers implements Action {
  readonly type = SET_PEERS_ECL;
  constructor(public payload: Peer[]) {}
}

export class SaveNewPeer implements Action {
  readonly type = SAVE_NEW_PEER_ECL;
  constructor(public payload: {id: string}) {}
}

export class NewlyAddedPeer implements Action {
  readonly type = NEWLY_ADDED_PEER_ECL;
  constructor(public payload: { peer: Peer }) {}
}

export class AddPeer implements Action {
  readonly type = ADD_PEER_ECL;
  constructor(public payload: Peer) {}
}

export class DisconnectPeer implements Action {
  readonly type = DETACH_PEER_ECL;
  constructor(public payload: {nodeId: string}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER_ECL;
  constructor(public payload: {nodeId: string}) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS_ECL;
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS_ECL;
  constructor(public payload: string) {} // payload = newAddress
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL_ECL;
  constructor(public payload: {nodeId: string, amount: number, private: boolean, feeRate?: number}) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS_ECL;
  constructor(public payload: {baseFeeMsat: number, feeRate: number, channelId?: string, channelIds?: string}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL_ECL;
  constructor(public payload: {channelId: string, force: boolean}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL_ECL;
  constructor(public payload: {channelId: string}) {}
}

export class FetchPayments implements Action {
  readonly type = FETCH_PAYMENTS_ECL;
}

export class SetPayments implements Action {
  readonly type = SET_PAYMENTS_ECL;
  constructor(public payload: Payments) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES_ECL;
  constructor(public payload: {nodeId: string, amount: number}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES_ECL;
  constructor(public payload: Route[]) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT_ECL;
  constructor(public payload: { fromDialog: boolean, invoice: string, amountMsat?: number }) {}
}

export class SendPaymentStatus implements Action {
  readonly type = SEND_PAYMENT_STATUS_ECL;
  constructor(public payload: any) {}
}

export class FetchTransactions implements Action {
  readonly type = FETCH_TRANSACTIONS_ECL;
}

export class SetTransactions implements Action {
  readonly type = SET_TRANSACTIONS_ECL;
  constructor(public payload: Transaction[]) {}
}

export class SendOnchainFunds implements Action {
  readonly type = SEND_ONCHAIN_FUNDS_ECL;
  constructor(public payload: SendPaymentOnChain) {}
}

export class SendOnchainFundsRes implements Action {
  readonly type = SEND_ONCHAIN_FUNDS_RES_ECL;
  constructor(public payload: any) {}
}

export class FetchInvoices implements Action {
  readonly type = FETCH_INVOICES_ECL;
}

export class SetInvoices implements Action {
  readonly type = SET_INVOICES_ECL;
  constructor(public payload: Invoice[]) {}
}

export class CreateInvoice implements Action {
  readonly type = CREATE_INVOICE_ECL;
  constructor(public payload: {description: string, expireIn: number, amountMsat?: number}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE_ECL;
  constructor(public payload: Invoice) {}
}

export class PeerLookup implements Action {
  readonly type = PEER_LOOKUP_ECL;
  constructor(public payload: string) {} // payload = id
}

export class SetLookup implements Action {
  readonly type = SET_LOOKUP_ECL;
  constructor(public payload: any) {} // payload = lookup Response (Peer)
}

export type ECLActions = ResetECLStore | ClearEffectError | EffectError | SetChildNodeSettings |
  FetchInfo | SetInfo | FetchFees | SetFees |
  FetchChannels | SetActiveChannels | SetPendingChannels | SetInactiveChannels |
  FetchPeers | SetPeers | AddPeer | DisconnectPeer | SaveNewPeer | RemovePeer | NewlyAddedPeer |
  SetChannelsStatus | FetchChannelStats | SetChannelStats |
  FetchOnchainBalance | SetOnchainBalance | GetNewAddress | SetNewAddress |
  SendOnchainFunds | SendOnchainFundsRes | FetchTransactions | SetTransactions |
  SetLightningBalance | FetchPeers | SetPeers | PeerLookup | SetLookup |
  SaveNewChannel | UpdateChannels | CloseChannel | RemoveChannel |
  FetchPayments | SetPayments | SendPayment | SendPaymentStatus |
  FetchInvoices | SetInvoices | CreateInvoice | AddInvoice;
