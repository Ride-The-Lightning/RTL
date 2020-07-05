import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, Peer, LightningBalance, OnChainBalance, ChannelsStatus, Payments, Route, PayRequest, Transaction, SendPaymentOnChain, Invoice } from '../../shared/models/eclrModels';

export const RESET_ECLR_STORE = 'RESET_ECLR_STORE';
export const CLEAR_EFFECT_ERROR_ECLR = 'CLEAR_EFFECT_ERROR_ECLR';
export const EFFECT_ERROR_ECLR = 'EFFECT_ERROR_ECLR';
export const SET_CHILD_NODE_SETTINGS_ECLR = 'SET_CHILD_NODE_SETTINGS_ECLR';
export const FETCH_INFO_ECLR = 'FETCH_INFO_ECLR';
export const SET_INFO_ECLR = 'SET_INFO_ECLR';
export const FETCH_AUDIT_ECLR = 'FETCH_AUDIT_ECLR';
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
export const SAVE_NEW_PEER_ECLR = 'SAVE_NEW_PEER_ECLR';
export const NEWLY_ADDED_PEER_ECLR = 'NEWLY_ADDED_PEER_ECLR';
export const ADD_PEER_ECLR = 'ADD_PEER_ECLR';
export const DETACH_PEER_ECLR = 'DETACH_PEER_ECLR';
export const REMOVE_PEER_ECLR = 'REMOVE_PEER_ECLR';
export const GET_NEW_ADDRESS_ECLR = 'GET_NEW_ADDRESS_ECLR';
export const SET_NEW_ADDRESS_ECLR = 'SET_NEW_ADDRESS_ECLR';
export const SAVE_NEW_CHANNEL_ECLR = 'SAVE_NEW_CHANNEL_ECLR';
export const UPDATE_CHANNELS_ECLR = 'UPDATE_CHANNELS_ECLR';
export const CLOSE_CHANNEL_ECLR = 'CLOSE_CHANNEL_ECLR';
export const REMOVE_CHANNEL_ECLR = 'REMOVE_CHANNEL_ECLR';
export const SET_PAYMENTS_ECLR = 'SET_PAYMENTS_ECLR';
export const GET_QUERY_ROUTES_ECLR = 'GET_QUERY_ROUTES_ECLR';
export const SET_QUERY_ROUTES_ECLR = 'SET_QUERY_ROUTES_ECLR';
export const DECODE_PAYMENT_ECLR = 'DECODE_PAYMENT_ECLR';
export const SET_DECODED_PAYMENT_ECLR = 'SET_DECODED_PAYMENT_ECLR';
export const SEND_PAYMENT_ECLR = 'SEND_PAYMENT_ECLR';
export const SEND_PAYMENT_STATUS_ECLR = 'SEND_PAYMENT_STATUS_ECLR';
export const FETCH_TRANSACTIONS_ECLR = 'FETCH_TRANSACTIONS_ECLR';
export const SET_TRANSACTIONS_ECLR = 'SET_TRANSACTIONS_ECLR';
export const SEND_ONCHAIN_FUNDS_ECLR = 'SEND_ONCHAIN_FUNDS_ECLR';
export const SEND_ONCHAIN_FUNDS_RES_ECLR = 'SEND_ONCHAIN_FUNDS_RES_ECLR';
export const FETCH_INVOICES_ECLR = 'FETCH_INVOICES_ECLR';
export const SET_INVOICES_ECLR = 'SET_INVOICES_ECLR';
export const SET_TOTAL_INVOICES_ECLR = 'SET_TOTAL_INVOICES_ECLR';
export const CREATE_INVOICE_ECLR = 'CREATE_INVOICE_ECLR';
export const ADD_INVOICE_ECLR = 'ADD_INVOICE_ECLR';

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

export class FetchAudit implements Action {
  readonly type = FETCH_AUDIT_ECLR;
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

export class SaveNewPeer implements Action {
  readonly type = SAVE_NEW_PEER_ECLR;
  constructor(public payload: {id: string}) {}
}

export class NewlyAddedPeer implements Action {
  readonly type = NEWLY_ADDED_PEER_ECLR;
  constructor(public payload: { peer: Peer }) {}
}

export class AddPeer implements Action {
  readonly type = ADD_PEER_ECLR;
  constructor(public payload: Peer) {}
}

export class DisconnectPeer implements Action {
  readonly type = DETACH_PEER_ECLR;
  constructor(public payload: {nodeId: string}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER_ECLR;
  constructor(public payload: {nodeId: string}) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS_ECLR;
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS_ECLR;
  constructor(public payload: string) {} // payload = newAddress
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL_ECLR;
  constructor(public payload: {nodeId: string, amount: number, private: boolean, feeRate?: number}) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS_ECLR;
  constructor(public payload: {baseFeeMsat: number, feeRate: number, channelId?: string, channelIds?: string}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL_ECLR;
  constructor(public payload: {channelId: string}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL_ECLR;
  constructor(public payload: {channelId: string}) {}
}

export class SetPayments implements Action {
  readonly type = SET_PAYMENTS_ECLR;
  constructor(public payload: Payments) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES_ECLR;
  constructor(public payload: {nodeId: string, amount: number}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES_ECLR;
  constructor(public payload: Route[]) {}
}

export class DecodePayment implements Action {
  readonly type = DECODE_PAYMENT_ECLR;
  constructor(public payload: {routeParam: string, fromDialog: boolean}) {} // payload = routeParam
}

export class SetDecodedPayment implements Action {
  readonly type = SET_DECODED_PAYMENT_ECLR;
  constructor(public payload: PayRequest) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT_ECLR;
  constructor(public payload: { fromDialog: boolean, invoice: string, amountMsat?: number }) {}
}

export class SendPaymentStatus implements Action {
  readonly type = SEND_PAYMENT_STATUS_ECLR;
  constructor(public payload: any) {}
}

export class FetchTransactions implements Action {
  readonly type = FETCH_TRANSACTIONS_ECLR;
}

export class SetTransactions implements Action {
  readonly type = SET_TRANSACTIONS_ECLR;
  constructor(public payload: Transaction[]) {}
}

export class SendOnchainFunds implements Action {
  readonly type = SEND_ONCHAIN_FUNDS_ECLR;
  constructor(public payload: SendPaymentOnChain) {}
}

export class SendOnchainFundsRes implements Action {
  readonly type = SEND_ONCHAIN_FUNDS_RES_ECLR;
  constructor(public payload: any) {}
}

export class FetchInvoices implements Action {
  readonly type = FETCH_INVOICES_ECLR;
}

export class SetInvoices implements Action {
  readonly type = SET_INVOICES_ECLR;
  constructor(public payload: Invoice[]) {}
}

export class CreateInvoice implements Action {
  readonly type = CREATE_INVOICE_ECLR;
  constructor(public payload: {description: string, expireIn: number, amountMsat?: number}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE_ECLR;
  constructor(public payload: Invoice) {}
}

export type ECLRActions = ResetECLRStore | ClearEffectError | EffectError | SetChildNodeSettings |
  FetchInfo | SetInfo | FetchAudit | SetFees |
  FetchChannels | SetActiveChannels | SetPendingChannels | SetInactiveChannels |
  FetchPeers | SetPeers | AddPeer | DisconnectPeer | SaveNewPeer | RemovePeer | NewlyAddedPeer |
  SetChannelsStatus | FetchChannelStats | SetChannelStats |
  FetchOnchainBalance | SetOnchainBalance | GetNewAddress | SetNewAddress |
  SendOnchainFunds | SendOnchainFundsRes | FetchTransactions | SetTransactions |
  SetLightningBalance | FetchPeers | SetPeers |
  SaveNewChannel | UpdateChannels | CloseChannel | RemoveChannel |
  SetPayments | DecodePayment | SetDecodedPayment | SendPayment | SendPaymentStatus |
  FetchInvoices | SetInvoices | CreateInvoice | AddInvoice;
