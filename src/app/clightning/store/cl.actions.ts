import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, Peer, Payment, PayRequest, QueryRoutes, Channel, FeeRates, ForwardingHistoryRes, Invoice, ListInvoices, OnChain } from '../../shared/models/clModels';

export const RESET_CL_STORE = 'RESET_CL_STORE';
export const CLEAR_EFFECT_ERROR = 'CLEAR_EFFECT_ERROR';
export const EFFECT_ERROR = 'EFFECT_ERROR';
export const SET_CHILD_NODE_SETTINGS = 'SET_CHILD_NODE_SETTINGS';
export const FETCH_INFO = 'FETCH_INFO';
export const SET_INFO = 'SET_INFO';
export const FETCH_FEES = 'FETCH_FEES';
export const SET_FEES = 'SET_FEES';
export const FETCH_FEE_RATES = 'FETCH_FEE_RATES';
export const SET_FEE_RATES = 'SET_FEE_RATES';
export const FETCH_BALANCE = 'FETCH_BALANCE';
export const SET_BALANCE = 'SET_BALANCE';
export const FETCH_LOCAL_REMOTE_BALANCE = 'FETCH_LOCAL_REMOTE_BALANCE';
export const SET_LOCAL_REMOTE_BALANCE = 'SET_LOCAL_REMOTE_BALANCE';
export const GET_NEW_ADDRESS = 'GET_NEW_ADDRESS';
export const SET_NEW_ADDRESS = 'SET_NEW_ADDRESS';
export const FETCH_PEERS = 'FETCH_PEERS';
export const SET_PEERS = 'SET_PEERS';
export const SAVE_NEW_PEER = 'SAVE_NEW_PEER';
export const NEWLY_ADDED_PEER = 'NEWLY_ADDED_PEER';
export const ADD_PEER = 'ADD_PEER';
export const DETACH_PEER = 'DETACH_PEER';
export const REMOVE_PEER = 'REMOVE_PEER';
export const FETCH_CHANNELS = 'FETCH_CHANNELS';
export const SET_CHANNELS = 'SET_CHANNELS';
export const UPDATE_CHANNELS = 'UPDATE_CHANNELS';
export const SAVE_NEW_CHANNEL = 'SAVE_NEW_CHANNEL';
export const CLOSE_CHANNEL = 'CLOSE_CHANNEL';
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL';
export const FETCH_PAYMENTS = 'FETCH_PAYMENTS';
export const SET_PAYMENTS = 'SET_PAYMENTS';
export const DECODE_PAYMENT = 'DECODE_PAYMENT';
export const SEND_PAYMENT = 'SEND_PAYMENT';
export const SEND_PAYMENT_STATUS = 'SEND_PAYMENT_STATUS';
export const SET_DECODED_PAYMENT = 'SET_DECODED_PAYMENT';
export const GET_QUERY_ROUTES = 'GET_QUERY_ROUTES';
export const SET_QUERY_ROUTES = 'SET_QUERY_ROUTES';
export const PEER_LOOKUP = 'PEER_LOOKUP';
export const CHANNEL_LOOKUP = 'CHANNEL_LOOKUP';
export const INVOICE_LOOKUP = 'INVOICE_LOOKUP';
export const SET_LOOKUP = 'SET_LOOKUP';
export const GET_FORWARDING_HISTORY = 'GET_FORWARDING_HISTORY';
export const SET_FORWARDING_HISTORY = 'SET_FORWARDING_HISTORY';
export const FETCH_INVOICES = 'FETCH_INVOICES';
export const SET_INVOICES = 'SET_INVOICES';
export const SET_TOTAL_INVOICES = 'SET_TOTAL_INVOICES';
export const SAVE_NEW_INVOICE = 'SAVE_NEW_INVOICE';
export const ADD_INVOICE = 'ADD_INVOICE';
export const DELETE_EXPIRED_INVOICE = 'DELETE_EXPIRED_INVOICE';
export const SET_CHANNEL_TRANSACTION = 'SET_CHANNEL_TRANSACTION';
export const SET_CHANNEL_TRANSACTION_RES = 'SET_CHANNEL_TRANSACTION_RES';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR;
  constructor(public payload: string) { } // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR;
  constructor(public payload: ErrorPayload) { }
}

export class ResetCLStore implements Action {
  readonly type = RESET_CL_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfoCL implements Action {
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

export class FetchFeeRates implements Action {
  readonly type = FETCH_FEE_RATES;
  constructor(public payload: string) {} //feeRateStyle
}

export class SetFeeRates implements Action {
  readonly type = SET_FEE_RATES;
  constructor(public payload: FeeRates) {}
}

export class FetchBalance implements Action {
  readonly type = FETCH_BALANCE;
}

export class SetBalance implements Action {
  readonly type = SET_BALANCE;
  constructor(public payload: {}) {}
}

export class FetchLocalRemoteBalance implements Action {
  readonly type = FETCH_LOCAL_REMOTE_BALANCE;
}

export class SetLocalRemoteBalance implements Action {
  readonly type = SET_LOCAL_REMOTE_BALANCE;
  constructor(public payload: {localBalance: number, remoteBalance: number}) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS;
  constructor(public payload: { addressId?: string, addressCode?: string, addressTp?: string, addressDetails?: string}) {}
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS;
  constructor(public payload: string) {} // payload = newAddress
}

export class FetchPeers implements Action {
  readonly type = FETCH_PEERS;
}

export class SetPeers implements Action {
  readonly type = SET_PEERS;
  constructor(public payload: Peer[]) {}
}

export class SaveNewPeer implements Action {
  readonly type = SAVE_NEW_PEER;
  constructor(public payload: {id: string}) {}
}

export class NewlyAddedPeer implements Action {
  readonly type = NEWLY_ADDED_PEER;
  constructor(public payload: { peer: Peer, balance: number}) {}
}

export class AddPeer implements Action {
  readonly type = ADD_PEER;
  constructor(public payload: Peer) {}
}

export class DetachPeer implements Action {
  readonly type = DETACH_PEER;
  constructor(public payload: {id: string, force: boolean}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER;
  constructor(public payload: {id: string}) {}
}

export class FetchPayments implements Action {
  readonly type = FETCH_PAYMENTS;
}

export class SetPayments implements Action {
  readonly type = SET_PAYMENTS;
  constructor(public payload: Payment[]) {}
}

export class DecodePayment implements Action {
  readonly type = DECODE_PAYMENT;
  constructor(public payload: {routeParam: string, fromDialog: boolean}) {} // payload = routeParam
}

export class SetDecodedPayment implements Action {
  readonly type = SET_DECODED_PAYMENT;
  constructor(public payload: PayRequest) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT;
  constructor(public payload: { fromDialog: boolean, invoice: string, amount?: number }) {}
}

export class SendPaymentStatus implements Action {
  readonly type = SEND_PAYMENT_STATUS;
  constructor(public payload: any) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES;
  constructor(public payload: {destPubkey: string, amount: number}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES;
  constructor(public payload: QueryRoutes) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS;
}

export class SetChannels implements Action {
  readonly type = SET_CHANNELS;
  constructor(public payload: Channel[]) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS;
  constructor(public payload: {channelId: string, baseFeeMsat: number, feeRate: number}) {}
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL;
  constructor(public payload: {peerId: string, satoshis: number, feeRate: string, announce: boolean, minconf?: number}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL;
  constructor(public payload: {channelId: string, timeoutSec?: number}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL;
  constructor(public payload: {channelId: string}) {}
}

export class PeerLookup implements Action {
  readonly type = PEER_LOOKUP;
  constructor(public payload: string) {} // payload = id
}

export class ChannelLookup implements Action {
  readonly type = CHANNEL_LOOKUP;
  constructor(public payload: {shortChannelID: string, showError: boolean}) {}
}

export class InvoiceLookup implements Action {
  readonly type = INVOICE_LOOKUP;
  constructor(public payload: string) {} // payload = rHashStr
}

export class SetLookup implements Action {
  readonly type = SET_LOOKUP;
  constructor(public payload: any) {} // payload = lookup Response (Peer/Channel/Invoice)
}

export class GetForwardingHistory implements Action {
  readonly type = GET_FORWARDING_HISTORY;
  // constructor(public payload: SwitchReq) {}
}

export class SetForwardingHistory implements Action {
  readonly type = SET_FORWARDING_HISTORY;
  constructor(public payload: ForwardingHistoryRes) {}
}

export class FetchInvoices implements Action {
  readonly type = FETCH_INVOICES;
  constructor(public payload: {num_max_invoices?: number, index_offset?: number, reversed?: boolean}) {}
}

export class SetInvoices implements Action {
  readonly type = SET_INVOICES;
  constructor(public payload: ListInvoices) {}
}

export class SetTotalInvoices implements Action {
  readonly type = SET_TOTAL_INVOICES;
  constructor(public payload: number) {}
}

export class SaveNewInvoice implements Action {
  readonly type = SAVE_NEW_INVOICE;
  constructor(public payload: {amount: number, label: string, description: string, expiry: number, private: boolean}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE;
  constructor(public payload: Invoice) {}
}

export class DeleteExpiredInvoice implements Action {
  readonly type = DELETE_EXPIRED_INVOICE;
  constructor(public payload?: number) {} // maxexpiry
}

export class SetChannelTransaction implements Action {
  readonly type = SET_CHANNEL_TRANSACTION;
  constructor(public payload: OnChain) {}
}

export class SetChannelTransactionRes implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_RES;
  constructor(public payload: any) {}
}

export type CLActions =   ClearEffectError | EffectError | ResetCLStore |
SetChildNodeSettings | FetchInfoCL | SetInfo | FetchFees | SetFees | FetchFeeRates | SetFeeRates |
FetchBalance | SetBalance | FetchLocalRemoteBalance | SetLocalRemoteBalance |
GetNewAddress | SetNewAddress |
FetchPeers | SetPeers | AddPeer | DetachPeer | SaveNewPeer | RemovePeer | NewlyAddedPeer |
FetchChannels | SetChannels | UpdateChannels | SaveNewChannel | CloseChannel | RemoveChannel |
FetchPayments | SetPayments | SendPayment | SendPaymentStatus | DecodePayment | SetDecodedPayment |
GetQueryRoutes | SetQueryRoutes | SetChannelTransaction | SetChannelTransactionRes |
PeerLookup | ChannelLookup | InvoiceLookup | SetLookup |
GetForwardingHistory | SetForwardingHistory |
FetchInvoices | SetInvoices | SetTotalInvoices | SaveNewInvoice | AddInvoice | DeleteExpiredInvoice;