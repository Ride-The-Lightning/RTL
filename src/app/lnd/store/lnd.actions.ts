import { Action } from '@ngrx/store';

import { ErrorPayload } from '../../shared/models/errorPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { 
  GetInfo, Peer, Balance, NetworkInfo, Fees, Channel, Invoice, ListInvoices, Payment,
  PayRequest, ChannelsTransaction, PendingChannels, ClosedChannel, Transaction, SwitchReq, 
  SwitchRes, QueryRoutes, PendingChannelsGroup, LightningNode, UTXO }
from '../../shared/models/lndModels';

export const RESET_LND_STORE = 'RESET_LND_STORE';
export const CLEAR_EFFECT_ERROR_LND = 'CLEAR_EFFECT_ERROR_LND';
export const EFFECT_ERROR_LND = 'EFFECT_ERROR_LND';
export const SET_CHILD_NODE_SETTINGS_LND = 'SET_CHILD_NODE_SETTINGS_LND';
export const FETCH_INFO_LND = 'FETCH_INFO_LND';
export const SET_INFO_LND = 'SET_INFO_LND';
export const FETCH_PEERS_LND = 'FETCH_PEERS_LND';
export const SET_PEERS_LND = 'SET_PEERS_LND';
export const SAVE_NEW_PEER_LND = 'SAVE_NEW_PEER_LND';
export const NEWLY_ADDED_PEER_LND = 'NEWLY_ADDED_PEER_LND';
export const DETACH_PEER_LND = 'DETACH_PEER_LND';
export const REMOVE_PEER_LND = 'REMOVE_PEER_LND';
export const SAVE_NEW_INVOICE_LND = 'SAVE_NEW_INVOICE_LND';
export const NEWLY_SAVED_INVOICE_LND = 'NEWLY_SAVED_INVOICE_LND';
export const ADD_INVOICE_LND = 'ADD_INVOICE_LND';
export const FETCH_FEES_LND = 'FETCH_FEES_LND';
export const SET_FEES_LND = 'SET_FEES_LND';
export const FETCH_BALANCE_LND = 'FETCH_BALANCE_LND';
export const SET_BALANCE_LND = 'SET_BALANCE_LND';
export const FETCH_NETWORK_LND = 'FETCH_NETWORK_LND';
export const SET_NETWORK_LND = 'SET_NETWORK_LND';
export const FETCH_ALL_CHANNELS_LND = 'FETCH_ALL_CHANNELS_LND';
export const FETCH_PENDING_CHANNELS_LND = 'FETCH_PENDING_CHANNELS_LND';
export const FETCH_CLOSED_CHANNELS_LND = 'FETCH_CLOSED_CHANNELS_LND';
export const SET_ALL_CHANNELS_LND = 'SET_ALL_CHANNELS_LND';
export const SET_PENDING_CHANNELS_LND = 'SET_PENDING_CHANNELS_LND';
export const SET_CLOSED_CHANNELS_LND = 'SET_CLOSED_CHANNELS_LND';
export const UPDATE_CHANNELS_LND = 'UPDATE_CHANNELS_LND';
export const SAVE_NEW_CHANNEL_LND = 'SAVE_NEW_CHANNEL_LND';
export const CLOSE_CHANNEL_LND = 'CLOSE_CHANNEL_LND';
export const REMOVE_CHANNEL_LND = 'REMOVE_CHANNEL_LND';
export const BACKUP_CHANNELS_LND = 'BACKUP_CHANNELS_LND';
export const VERIFY_CHANNELS_LND = 'VERIFY_CHANNELS_LND';
export const BACKUP_CHANNELS_RES_LND = 'BACKUP_CHANNELS_RES_LND';
export const VERIFY_CHANNELS_RES_LND = 'VERIFY_CHANNELS_RES_LND';
export const RESTORE_CHANNELS_LIST_LND = 'RESTORE_CHANNELS_LIST_LND';
export const SET_RESTORE_CHANNELS_LIST_LND = 'SET_RESTORE_CHANNELS_LIST_LND';
export const RESTORE_CHANNELS_LND = 'RESTORE_CHANNELS_LND';
export const RESTORE_CHANNELS_RES_LND = 'RESTORE_CHANNELS_RES_LND';
export const FETCH_INVOICES_LND = 'FETCH_INVOICES_LND';
export const SET_INVOICES_LND = 'SET_INVOICES_LND';
export const SET_TOTAL_INVOICES_LND = 'SET_TOTAL_INVOICES_LND';
export const FETCH_TRANSACTIONS_LND = 'FETCH_TRANSACTIONS_LND';
export const SET_TRANSACTIONS_LND = 'SET_TRANSACTIONS_LND';
export const FETCH_UTXOS_LND = 'FETCH_UTXOS_LND';
export const SET_UTXOS_LND = 'SET_UTXOS_LND';
export const FETCH_PAYMENTS_LND = 'FETCH_PAYMENTS_LND';
export const SET_PAYMENTS_LND = 'SET_PAYMENTS_LND';
export const SEND_PAYMENT_LND = 'SEND_PAYMENT_LND';
export const SEND_PAYMENT_STATUS_LND = 'SEND_PAYMENT_STATUS_LND';
export const FETCH_GRAPH_NODE_LND = 'FETCH_GRAPH_NODE_LND';
export const SET_GRAPH_NODE_LND = 'SET_GRAPH_NODE_LND';
export const GET_NEW_ADDRESS_LND = 'GET_NEW_ADDRESS_LND';
export const SET_NEW_ADDRESS_LND = 'SET_NEW_ADDRESS_LND';
export const SET_CHANNEL_TRANSACTION_LND = 'SET_CHANNEL_TRANSACTION_LND';
export const SET_CHANNEL_TRANSACTION_RES_LND = 'SET_CHANNEL_TRANSACTION_RES_LND';
export const GEN_SEED_LND = 'GEN_SEED_LND';
export const GEN_SEED_RESPONSE_LND = 'GEN_SEED_RESPONSE_LND';
export const INIT_WALLET_LND = 'INIT_WALLET_LND';
export const INIT_WALLET_RESPONSE_LND = 'INIT_WALLET_RESPONSE_LND';
export const UNLOCK_WALLET_LND = 'UNLOCK_WALLET_LND';
export const PEER_LOOKUP_LND = 'PEER_LOOKUP_LND';
export const CHANNEL_LOOKUP_LND = 'CHANNEL_LOOKUP_LND';
export const INVOICE_LOOKUP_LND = 'INVOICE_LOOKUP_LND';
export const SET_LOOKUP_LND = 'SET_LOOKUP_LND';
export const GET_FORWARDING_HISTORY_LND = 'GET_FORWARDING_HISTORY_LND';
export const SET_FORWARDING_HISTORY_LND = 'SET_FORWARDING_HISTORY_LND';
export const GET_QUERY_ROUTES_LND = 'GET_QUERY_ROUTES_LND';
export const SET_QUERY_ROUTES_LND = 'SET_QUERY_ROUTES_LND';

export class ClearEffectError implements Action {
  readonly type = CLEAR_EFFECT_ERROR_LND;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectError implements Action {
  readonly type = EFFECT_ERROR_LND;
  constructor(public payload: ErrorPayload) {}
}

export class ResetLNDStore implements Action {
  readonly type = RESET_LND_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS_LND;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO_LND;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfo implements Action {
  readonly type = SET_INFO_LND;
  constructor(public payload: GetInfo) {}
}

export class FetchPeers implements Action {
  readonly type = FETCH_PEERS_LND;
}

export class SetPeers implements Action {
  readonly type = SET_PEERS_LND;
  constructor(public payload: Peer[]) {}
}

export class SaveNewPeer implements Action {
  readonly type = SAVE_NEW_PEER_LND;
  constructor(public payload: {pubkey: string, host: string, perm: boolean}) {}
}

export class NewlyAddedPeer implements Action {
  readonly type = NEWLY_ADDED_PEER_LND;
  constructor(public payload: { peer: Peer, balance: number}) {}
}

export class DetachPeer implements Action {
  readonly type = DETACH_PEER_LND;
  constructor(public payload: {pubkey: string}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER_LND;
  constructor(public payload: {pubkey: string}) {}
}

export class SaveNewInvoice implements Action {
  readonly type = SAVE_NEW_INVOICE_LND;
  constructor(public payload: {memo: string, invoiceValue: number, private: boolean, expiry: number, pageSize: number, openModal: boolean}) {}
}

export class NewlySavedInvoice implements Action {
  readonly type = NEWLY_SAVED_INVOICE_LND;
  constructor(public payload: { paymentRequest: string}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE_LND;
  constructor(public payload: Invoice) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES_LND;
}

export class SetFees implements Action {
  readonly type = SET_FEES_LND;
  constructor(public payload: Fees) {}
}

export class FetchBalance implements Action {
  readonly type = FETCH_BALANCE_LND;
  constructor(public payload: string) {} // payload = routeParam
}

export class SetBalance implements Action {
  readonly type = SET_BALANCE_LND;
  constructor(public payload: {target: string, balance: Balance}) {}
}

export class FetchNetwork implements Action {
  readonly type = FETCH_NETWORK_LND;
}

export class SetNetwork implements Action {
  readonly type = SET_NETWORK_LND;
  constructor(public payload: NetworkInfo) {}
}

export class FetchAllChannels implements Action {
  readonly type = FETCH_ALL_CHANNELS_LND;
}

export class SetAllChannels implements Action {
  readonly type = SET_ALL_CHANNELS_LND;
  constructor(public payload: Channel[]) {}
}

export class FetchPendingChannels implements Action {
  readonly type = FETCH_PENDING_CHANNELS_LND;
}

export class SetPendingChannels implements Action {
  readonly type = SET_PENDING_CHANNELS_LND;
  constructor(public payload: {channels: PendingChannels, pendingChannels: PendingChannelsGroup}) {}
}

export class FetchClosedChannels implements Action {
  readonly type = FETCH_CLOSED_CHANNELS_LND;
}

export class SetClosedChannels implements Action {
  readonly type = SET_CLOSED_CHANNELS_LND;
  constructor(public payload: ClosedChannel[]) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS_LND;
  constructor(public payload: any) {}
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL_LND;
  constructor(public payload: {selectedPeerPubkey: string, fundingAmount: number, private: boolean, transType: string, transTypeValue: string, spendUnconfirmed: boolean}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL_LND;
  constructor(public payload: {channelPoint: string, forcibly: boolean, targetConf?: number, satPerByte?: number}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL_LND;
  constructor(public payload: {channelPoint: string}) {}
}

export class BackupChannels implements Action {
  readonly type = BACKUP_CHANNELS_LND;
  constructor(public payload: {channelPoint: string, showMessage: string}) {}
}

export class VerifyChannels implements Action {
  readonly type = VERIFY_CHANNELS_LND;
  constructor(public payload: {channelPoint: string}) {}
}

export class BackupChannelsRes implements Action {
  readonly type = BACKUP_CHANNELS_RES_LND;
  constructor(public payload: string) {}
}

export class VerifyChannelsRes implements Action {
  readonly type = VERIFY_CHANNELS_RES_LND;
  constructor(public payload: string) {}
}

export class RestoreChannelsList implements Action {
  readonly type = RESTORE_CHANNELS_LIST_LND;
}

export class SetRestoreChannelsList implements Action {
  readonly type = SET_RESTORE_CHANNELS_LIST_LND;
  constructor(public payload: {all_restore_exists: boolean, files: []}) {}
}

export class RestoreChannels implements Action {
  readonly type = RESTORE_CHANNELS_LND;
  constructor(public payload: {channelPoint: string}) {}
}

export class RestoreChannelsRes implements Action {
  readonly type = RESTORE_CHANNELS_RES_LND;
  constructor(public payload: string) {}
}

export class FetchInvoices implements Action {
  readonly type = FETCH_INVOICES_LND;
  constructor(public payload: {num_max_invoices?: number, index_offset?: number, reversed?: boolean}) {}
}

export class SetInvoices implements Action {
  readonly type = SET_INVOICES_LND;
  constructor(public payload: ListInvoices) {}
}

export class SetTotalInvoices implements Action {
  readonly type = SET_TOTAL_INVOICES_LND;
  constructor(public payload: number) {}
}

export class FetchTransactions implements Action {
  readonly type = FETCH_TRANSACTIONS_LND;
}

export class SetTransactions implements Action {
  readonly type = SET_TRANSACTIONS_LND;
  constructor(public payload: Transaction[]) {}
}

export class FetchUTXOs implements Action {
  readonly type = FETCH_UTXOS_LND;
}

export class SetUTXOs implements Action {
  readonly type = SET_UTXOS_LND;
  constructor(public payload: UTXO[]) {}
}

export class FetchPayments implements Action {
  readonly type = FETCH_PAYMENTS_LND;
}

export class SetPayments implements Action {
  readonly type = SET_PAYMENTS_LND;
  constructor(public payload: Payment[]) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT_LND;
  constructor(public payload: { fromDialog: boolean, paymentReq: string, paymentAmount?: number, outgoingChannel?: Channel, feeLimitType?: {id: string, name: string}, feeLimit?: number, allowSelfPayment?: boolean, lastHopPubkey?: string }) {}
}

export class SendPaymentStatus implements Action {
  readonly type = SEND_PAYMENT_STATUS_LND;
  constructor(public payload: any) {}
}

export class FetchGraphNode implements Action {
  readonly type = FETCH_GRAPH_NODE_LND;
  constructor(public payload: {pubkey: string}) {}
}

export class SetGraphNode implements Action {
  readonly type = SET_GRAPH_NODE_LND;
  constructor(public payload: {node: LightningNode}) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS_LND;
  constructor(public payload: { addressId?: string, addressCode?: string, addressTp?: string, addressDetails?: string}) {}
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS_LND;
  constructor(public payload: string) {} // payload = newAddress
}

export class SetChannelTransaction implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_LND;
  constructor(public payload: ChannelsTransaction) {}
}

export class SetChannelTransactionRes implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_RES_LND;
  constructor(public payload: any) {}
}

export class GenSeed implements Action {
  readonly type = GEN_SEED_LND;
  constructor(public payload: string) {}
}

export class GenSeedResponse implements Action {
  readonly type = GEN_SEED_RESPONSE_LND;
  constructor(public payload: Array<string>) {}
}

export class InitWallet implements Action {
  readonly type = INIT_WALLET_LND;
  constructor(public payload: {pwd: string, cipher?: Array<string>, passphrase?: string}) {}
}

export class InitWalletResponse implements Action {
  readonly type = INIT_WALLET_RESPONSE_LND;
  constructor(public payload: string) {}
}

export class UnlockWallet implements Action {
  readonly type = UNLOCK_WALLET_LND;
  constructor(public payload: {pwd: string}) {}
}

export class PeerLookup implements Action {
  readonly type = PEER_LOOKUP_LND;
  constructor(public payload: string) {} // payload = pubkey
}

export class ChannelLookup implements Action {
  readonly type = CHANNEL_LOOKUP_LND;
  constructor(public payload: string) {} // payload = chanID
}

export class InvoiceLookup implements Action {
  readonly type = INVOICE_LOOKUP_LND;
  constructor(public payload: string) {} // payload = rHashStr
}

export class SetLookup implements Action {
  readonly type = SET_LOOKUP_LND;
  constructor(public payload: any) {} // payload = lookup Response (Peer/Channel/Invoice)
}

export class GetForwardingHistory implements Action {
  readonly type = GET_FORWARDING_HISTORY_LND;
  constructor(public payload: SwitchReq) {}
}

export class SetForwardingHistory implements Action {
  readonly type = SET_FORWARDING_HISTORY_LND;
  constructor(public payload: SwitchRes) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES_LND;
  constructor(public payload: {destPubkey: string, amount: number, outgoingChanId?: string}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES_LND;
  constructor(public payload: QueryRoutes) {}
}

export type LNDActions = ClearEffectError | EffectError | ResetLNDStore | SetChildNodeSettings |
FetchInfo | SetInfo | FetchPeers | SetPeers | NewlyAddedPeer | DetachPeer | SaveNewPeer | RemovePeer |
AddInvoice | SaveNewInvoice | NewlySavedInvoice | GetForwardingHistory | SetForwardingHistory |
FetchFees | SetFees |
FetchBalance | SetBalance |
FetchNetwork | SetNetwork |
FetchAllChannels | SetAllChannels | FetchPendingChannels | SetPendingChannels | FetchClosedChannels | SetClosedChannels | UpdateChannels |
SaveNewChannel | CloseChannel | RemoveChannel |
BackupChannels | VerifyChannels | BackupChannelsRes | VerifyChannelsRes |
RestoreChannels | RestoreChannelsRes | RestoreChannelsList | SetRestoreChannelsList |
FetchTransactions | SetTransactions | FetchUTXOs | SetUTXOs |
FetchInvoices | SetInvoices | SetTotalInvoices |
FetchPayments | SetPayments | SendPayment | SendPaymentStatus |
FetchGraphNode | SetGraphNode | GetQueryRoutes | SetQueryRoutes |
GetNewAddress | SetNewAddress | SetChannelTransaction | SetChannelTransactionRes |
GenSeed | GenSeedResponse | InitWallet | InitWalletResponse | UnlockWallet |
PeerLookup | ChannelLookup | InvoiceLookup | SetLookup;