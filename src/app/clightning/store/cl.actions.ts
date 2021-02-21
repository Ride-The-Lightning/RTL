import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, Peer, Payment, PayRequest, QueryRoutes, Channel, FeeRates,
  ForwardingHistoryRes, Invoice, ListInvoices, OnChain, UTXO
} from '../../shared/models/clModels';

export const RESET_CL_STORE = 'RESET_CL_STORE';
export const CLEAR_EFFECT_ERROR_CL = 'CLEAR_EFFECT_ERROR_CL';
export const EFFECT_ERROR_CL = 'EFFECT_ERROR_CL';
export const SET_CHILD_NODE_SETTINGS_CL = 'SET_CHILD_NODE_SETTINGS_CL';
export const FETCH_INFO_CL = 'FETCH_INFO_CL_CL';
export const SET_INFO_CL = 'SET_INFO_CL';
export const FETCH_FEES_CL = 'FETCH_FEES_CL';
export const SET_FEES_CL = 'SET_FEES_CL';
export const FETCH_FEE_RATES_CL = 'FETCH_FEE_RATES_CL';
export const SET_FEE_RATES_CL = 'SET_FEE_RATES_CL';
export const FETCH_BALANCE_CL = 'FETCH_BALANCE_CL';
export const SET_BALANCE_CL = 'SET_BALANCE_CL';
export const FETCH_LOCAL_REMOTE_BALANCE_CL = 'FETCH_LOCAL_REMOTE_BALANCE_CL';
export const SET_LOCAL_REMOTE_BALANCE_CL = 'SET_LOCAL_REMOTE_BALANCE_CL';
export const GET_NEW_ADDRESS_CL = 'GET_NEW_ADDRESS_CL';
export const SET_NEW_ADDRESS_CL = 'SET_NEW_ADDRESS_CL';
export const FETCH_UTXOS_CL = 'FETCH_UTXOS_CL';
export const SET_UTXOS_CL = 'SET_UTXOS_CL';
export const FETCH_PEERS_CL = 'FETCH_PEERS_CL';
export const SET_PEERS_CL = 'SET_PEERS_CL';
export const SAVE_NEW_PEER_CL = 'SAVE_NEW_PEER_CL';
export const NEWLY_ADDED_PEER_CL = 'NEWLY_ADDED_PEER_CL';
export const ADD_PEER_CL = 'ADD_PEER_CL';
export const DETACH_PEER_CL = 'DETACH_PEER_CL';
export const REMOVE_PEER_CL = 'REMOVE_PEER_CL';
export const FETCH_CHANNELS_CL = 'FETCH_CHANNELS_CL';
export const SET_CHANNELS_CL = 'SET_CHANNELS_CL';
export const UPDATE_CHANNELS_CL = 'UPDATE_CHANNELS_CL';
export const SAVE_NEW_CHANNEL_CL = 'SAVE_NEW_CHANNEL_CL';
export const CLOSE_CHANNEL_CL = 'CLOSE_CHANNEL_CL';
export const REMOVE_CHANNEL_CL = 'REMOVE_CHANNEL_CL';
export const FETCH_PAYMENTS_CL = 'FETCH_PAYMENTS_CL';
export const SET_PAYMENTS_CL = 'SET_PAYMENTS_CL';
export const DECODE_PAYMENT_CL = 'DECODE_PAYMENT_CL';
export const SET_DECODED_PAYMENT_CL = 'SET_DECODED_PAYMENT_CL';
export const SEND_PAYMENT_CL = 'SEND_PAYMENT_CL';
export const SEND_PAYMENT_STATUS_CL = 'SEND_PAYMENT_STATUS_CL';
export const GET_QUERY_ROUTES_CL = 'GET_QUERY_ROUTES_CL';
export const SET_QUERY_ROUTES_CL = 'SET_QUERY_ROUTES_CL';
export const PEER_LOOKUP_CL = 'PEER_LOOKUP_CL';
export const CHANNEL_LOOKUP_CL = 'CHANNEL_LOOKUP_CL';
export const INVOICE_LOOKUP_CL = 'INVOICE_LOOKUP_CL';
export const SET_LOOKUP_CL = 'SET_LOOKUP_CL';
export const GET_FORWARDING_HISTORY_CL = 'GET_FORWARDING_HISTORY_CL';
export const SET_FORWARDING_HISTORY_CL = 'SET_FORWARDING_HISTORY_CL';
export const FETCH_INVOICES_CL = 'FETCH_INVOICES_CL';
export const SET_INVOICES_CL = 'SET_INVOICES_CL';
export const SET_TOTAL_INVOICES_CL = 'SET_TOTAL_INVOICES_CL';
export const SAVE_NEW_INVOICE_CL = 'SAVE_NEW_INVOICE_CL';
export const ADD_INVOICE_CL = 'ADD_INVOICE_CL';
export const DELETE_EXPIRED_INVOICE_CL = 'DELETE_EXPIRED_INVOICE_CL';
export const SET_CHANNEL_TRANSACTION_CL = 'SET_CHANNEL_TRANSACTION_CL';
export const SET_CHANNEL_TRANSACTION_RES_CL = 'SET_CHANNEL_TRANSACTION_RES_CL';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR_CL;
  constructor(public payload: string) { } // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR_CL;
  constructor(public payload: ErrorPayload) { }
}

export class ResetCLStore implements Action {
  readonly type = RESET_CL_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS_CL;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO_CL;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfo implements Action {
  readonly type = SET_INFO_CL;
  constructor(public payload: GetInfo) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES_CL;
}

export class SetFees implements Action {
  readonly type = SET_FEES_CL;
  constructor(public payload: Fees) {}
}

export class FetchFeeRates implements Action {
  readonly type = FETCH_FEE_RATES_CL;
  constructor(public payload: string) {} //feeRateStyle
}

export class SetFeeRates implements Action {
  readonly type = SET_FEE_RATES_CL;
  constructor(public payload: FeeRates) {}
}

export class FetchBalance implements Action {
  readonly type = FETCH_BALANCE_CL;
}

export class SetBalance implements Action {
  readonly type = SET_BALANCE_CL;
  constructor(public payload: {}) {}
}

export class FetchLocalRemoteBalance implements Action {
  readonly type = FETCH_LOCAL_REMOTE_BALANCE_CL;
}

export class SetLocalRemoteBalance implements Action {
  readonly type = SET_LOCAL_REMOTE_BALANCE_CL;
  constructor(public payload: {localBalance: number, remoteBalance: number}) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS_CL;
  constructor(public payload: { addressId?: string, addressCode?: string, addressTp?: string, addressDetails?: string}) {}
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS_CL;
  constructor(public payload: string) {} // payload = newAddress
}

export class FetchPeers implements Action {
  readonly type = FETCH_PEERS_CL;
}

export class SetPeers implements Action {
  readonly type = SET_PEERS_CL;
  constructor(public payload: Peer[]) {}
}

export class SaveNewPeer implements Action {
  readonly type = SAVE_NEW_PEER_CL;
  constructor(public payload: {id: string}) {}
}

export class NewlyAddedPeer implements Action {
  readonly type = NEWLY_ADDED_PEER_CL;
  constructor(public payload: { peer: Peer, balance: number}) {}
}

export class AddPeer implements Action {
  readonly type = ADD_PEER_CL;
  constructor(public payload: Peer) {}
}

export class DetachPeer implements Action {
  readonly type = DETACH_PEER_CL;
  constructor(public payload: {id: string, force: boolean}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER_CL;
  constructor(public payload: {id: string}) {}
}

export class FetchPayments implements Action {
  readonly type = FETCH_PAYMENTS_CL;
}

export class SetPayments implements Action {
  readonly type = SET_PAYMENTS_CL;
  constructor(public payload: Payment[]) {}
}

export class DecodePayment implements Action {
  readonly type = DECODE_PAYMENT_CL;
  constructor(public payload: {routeParam: string, fromDialog: boolean}) {} // payload = routeParam
}

export class SetDecodedPayment implements Action {
  readonly type = SET_DECODED_PAYMENT_CL;
  constructor(public payload: PayRequest) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT_CL;
  constructor(public payload: {fromDialog: boolean, invoice?: string, amount?: number, pubkey?: string}) {}
}

export class SendPaymentStatus implements Action {
  readonly type = SEND_PAYMENT_STATUS_CL;
  constructor(public payload: any) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES_CL;
  constructor(public payload: {destPubkey: string, amount: number}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES_CL;
  constructor(public payload: QueryRoutes) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS_CL;
}

export class SetChannels implements Action {
  readonly type = SET_CHANNELS_CL;
  constructor(public payload: Channel[]) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS_CL;
  constructor(public payload: {channelId: string, baseFeeMsat: number, feeRate: number}) {}
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL_CL;
  constructor(public payload: {peerId: string, satoshis: string, feeRate: string, announce: boolean, minconf?: number, utxos?: string[]}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL_CL;
  constructor(public payload: {channelId: string, force: boolean}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL_CL;
  constructor(public payload: {channelId: string}) {}
}

export class PeerLookup implements Action {
  readonly type = PEER_LOOKUP_CL;
  constructor(public payload: string) {} // payload = id
}

export class ChannelLookup implements Action {
  readonly type = CHANNEL_LOOKUP_CL;
  constructor(public payload: {shortChannelID: string, showError: boolean}) {}
}

export class InvoiceLookup implements Action {
  readonly type = INVOICE_LOOKUP_CL;
  constructor(public payload: string) {} // payload = rHashStr
}

export class SetLookup implements Action {
  readonly type = SET_LOOKUP_CL;
  constructor(public payload: any) {} // payload = lookup Response (Peer/Channel/Invoice)
}

export class GetForwardingHistory implements Action {
  readonly type = GET_FORWARDING_HISTORY_CL;
  // constructor(public payload: SwitchReq) {}
}

export class SetForwardingHistory implements Action {
  readonly type = SET_FORWARDING_HISTORY_CL;
  constructor(public payload: ForwardingHistoryRes) {}
}

export class FetchInvoices implements Action {
  readonly type = FETCH_INVOICES_CL;
  constructor(public payload: {num_max_invoices?: number, index_offset?: number, reversed?: boolean}) {}
}

export class SetInvoices implements Action {
  readonly type = SET_INVOICES_CL;
  constructor(public payload: ListInvoices) {}
}

export class SetTotalInvoices implements Action {
  readonly type = SET_TOTAL_INVOICES_CL;
  constructor(public payload: number) {}
}

export class SaveNewInvoice implements Action {
  readonly type = SAVE_NEW_INVOICE_CL;
  constructor(public payload: {amount: number, label: string, description: string, expiry: number, private: boolean}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE_CL;
  constructor(public payload: Invoice) {}
}

export class DeleteExpiredInvoice implements Action {
  readonly type = DELETE_EXPIRED_INVOICE_CL;
  constructor(public payload?: number) {} // maxexpiry
}

export class SetChannelTransaction implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_CL;
  constructor(public payload: OnChain) {}
}

export class SetChannelTransactionRes implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_RES_CL;
  constructor(public payload: any) {}
}

export class FetchUTXOs implements Action {
  readonly type = FETCH_UTXOS_CL;
}

export class SetUTXOs implements Action {
  readonly type = SET_UTXOS_CL;
  constructor(public payload: UTXO[]) {}
}

export type CLActions =   ClearEffectError | EffectError | ResetCLStore |
SetChildNodeSettings | FetchInfo | SetInfo | FetchFees | SetFees | FetchFeeRates | SetFeeRates |
FetchBalance | SetBalance | FetchLocalRemoteBalance | SetLocalRemoteBalance |
GetNewAddress | SetNewAddress | FetchUTXOs | SetUTXOs |
FetchPeers | SetPeers | AddPeer | DetachPeer | SaveNewPeer | RemovePeer | NewlyAddedPeer |
FetchChannels | SetChannels | UpdateChannels | SaveNewChannel | CloseChannel | RemoveChannel |
FetchPayments | SetPayments | SendPayment | SendPaymentStatus | DecodePayment | SetDecodedPayment |
GetQueryRoutes | SetQueryRoutes | SetChannelTransaction | SetChannelTransactionRes |
PeerLookup | ChannelLookup | InvoiceLookup | SetLookup |
GetForwardingHistory | SetForwardingHistory |
FetchInvoices | SetInvoices | SetTotalInvoices | SaveNewInvoice | AddInvoice | DeleteExpiredInvoice;