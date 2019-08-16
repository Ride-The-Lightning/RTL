import { Action } from '@ngrx/store';
import {
  GetInfo, Peer, Balance, NetworkInfo, Fees, Channel, Invoice, ListInvoices, Payment, GraphNode, AddressType,
  PayRequest, ChannelsTransaction, PendingChannels, ClosedChannel, Transaction, SwitchReq, SwitchRes, QueryRoutes
} from '../../shared/models/lndModels';

export const RESET_LND_STORE = 'RESET_LND_STORE';
export const FETCH_INFO = 'FETCH_INFO';
export const SET_INFO = 'SET_INFO';
export const FETCH_PEERS = 'FETCH_PEERS';
export const SET_PEERS = 'SET_PEERS';
export const SAVE_NEW_PEER = 'SAVE_NEW_PEER';
export const ADD_PEER = 'ADD_PEER';
export const DETACH_PEER = 'DETACH_PEER';
export const REMOVE_PEER = 'REMOVE_PEER';
export const SAVE_NEW_INVOICE = 'SAVE_NEW_INVOICE';
export const ADD_INVOICE = 'ADD_INVOICE';
export const FETCH_FEES = 'FETCH_FEES';
export const SET_FEES = 'SET_FEES';
export const FETCH_BALANCE = 'FETCH_BALANCE';
export const SET_BALANCE = 'SET_BALANCE';
export const FETCH_NETWORK = 'FETCH_NETWORK';
export const SET_NETWORK = 'SET_NETWORK';
export const FETCH_CHANNELS = 'FETCH_CHANNELS';
export const SET_CHANNELS = 'SET_CHANNELS';
export const UPDATE_CHANNELS = 'UPDATE_CHANNELS';
export const SET_PENDING_CHANNELS = 'SET_PENDING_CHANNELS';
export const SET_CLOSED_CHANNELS = 'SET_CLOSED_CHANNELS';
export const SAVE_NEW_CHANNEL = 'SAVE_NEW_CHANNEL';
export const CLOSE_CHANNEL = 'CLOSE_CHANNEL';
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL';
export const BACKUP_CHANNELS = 'BACKUP_CHANNELS';
export const VERIFY_CHANNELS = 'VERIFY_CHANNELS';
export const BACKUP_CHANNELS_RES = 'BACKUP_CHANNELS_RES';
export const VERIFY_CHANNELS_RES = 'VERIFY_CHANNELS_RES';
export const FETCH_INVOICES = 'FETCH_INVOICES';
export const SET_INVOICES = 'SET_INVOICES';
export const SET_TOTAL_INVOICES = 'SET_TOTAL_INVOICES';
export const FETCH_TRANSACTIONS = 'FETCH_TRANSACTIONS';
export const SET_TRANSACTIONS = 'SET_TRANSACTIONS';
export const FETCH_PAYMENTS = 'FETCH_PAYMENTS';
export const SET_PAYMENTS = 'SET_PAYMENTS';
export const DECODE_PAYMENT = 'DECODE_PAYMENT';
export const SEND_PAYMENT = 'SEND_PAYMENT';
export const SET_DECODED_PAYMENT = 'SET_DECODED_PAYMENT';
export const FETCH_GRAPH_NODE = 'FETCH_GRAPH_NODE';
export const SET_GRAPH_NODE = 'SET_GRAPH_NODE';
export const GET_NEW_ADDRESS = 'GET_NEW_ADDRESS';
export const SET_NEW_ADDRESS = 'SET_NEW_ADDRESS';
export const SET_CHANNEL_TRANSACTION = 'SET_CHANNEL_TRANSACTION';
export const GEN_SEED = 'GEN_SEED';
export const GEN_SEED_RESPONSE = 'GEN_SEED_RESPONSE';
export const INIT_WALLET = 'INIT_WALLET';
export const INIT_WALLET_RESPONSE = 'INIT_WALLET_RESPONSE';
export const UNLOCK_WALLET = 'UNLOCK_WALLET';
export const FETCH_CONFIG = 'FETCH_CONFIG';
export const SHOW_CONFIG = 'SHOW_CONFIG';
export const PEER_LOOKUP = 'PEER_LOOKUP';
export const CHANNEL_LOOKUP = 'CHANNEL_LOOKUP';
export const INVOICE_LOOKUP = 'INVOICE_LOOKUP';
export const SET_LOOKUP = 'SET_LOOKUP';
export const GET_FORWARDING_HISTORY = 'GET_FORWARDING_HISTORY';
export const SET_FORWARDING_HISTORY = 'SET_FORWARDING_HISTORY';
export const GET_QUERY_ROUTES = 'GET_QUERY_ROUTES';
export const SET_QUERY_ROUTES = 'SET_QUERY_ROUTES';

export class ResetLNDStore implements Action {
  readonly type = RESET_LND_STORE;
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO;
}

export class SetInfo implements Action {
  readonly type = SET_INFO;
  constructor(public payload: GetInfo) {}
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
  constructor(public payload: {pubkey: string, host: string, perm: boolean}) {}
}

export class AddPeer implements Action {
  readonly type = ADD_PEER;
  constructor(public payload: Peer) {}
}

export class DetachPeer implements Action {
  readonly type = DETACH_PEER;
  constructor(public payload: {pubkey: string}) {}
}

export class RemovePeer implements Action {
  readonly type = REMOVE_PEER;
  constructor(public payload: {pubkey: string}) {}
}

export class SaveNewInvoice implements Action {
  readonly type = SAVE_NEW_INVOICE;
  constructor(public payload: {memo: string, invoiceValue: number, private: boolean, expiry: number, pageSize: number}) {}
}

export class AddInvoice implements Action {
  readonly type = ADD_INVOICE;
  constructor(public payload: Invoice) {}
}

export class FetchFees implements Action {
  readonly type = FETCH_FEES;
}

export class SetFees implements Action {
  readonly type = SET_FEES;
  constructor(public payload: Fees) {}
}

export class FetchBalance implements Action {
  readonly type = FETCH_BALANCE;
  constructor(public payload: string) {} // payload = routeParam
}

export class SetBalance implements Action {
  readonly type = SET_BALANCE;
  constructor(public payload: {target: string, balance: Balance}) {}
}

export class FetchNetwork implements Action {
  readonly type = FETCH_NETWORK;
}

export class SetNetwork implements Action {
  readonly type = SET_NETWORK;
  constructor(public payload: NetworkInfo) {}
}

export class FetchChannels implements Action {
  readonly type = FETCH_CHANNELS;
  constructor(public payload: {routeParam: string}) {}
}

export class SetChannels implements Action {
  readonly type = SET_CHANNELS;
  constructor(public payload: Channel[]) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS;
  constructor(public payload: any) {}
}

export class SetPendingChannels implements Action {
  readonly type = SET_PENDING_CHANNELS;
  constructor(public payload: PendingChannels) {}
}

export class SetClosedChannels implements Action {
  readonly type = SET_CLOSED_CHANNELS;
  constructor(public payload: ClosedChannel[]) {}
}

export class SaveNewChannel implements Action {
  readonly type = SAVE_NEW_CHANNEL;
  constructor(public payload: {selectedPeerPubkey: string, fundingAmount: number, private: boolean, transType: string, transTypeValue: string, spendUnconfirmed: boolean}) {}
}

export class CloseChannel implements Action {
  readonly type = CLOSE_CHANNEL;
  constructor(public payload: {channelPoint: string, forcibly: boolean}) {}
}

export class RemoveChannel implements Action {
  readonly type = REMOVE_CHANNEL;
  constructor(public payload: {channelPoint: string}) {}
}

export class BackupChannels implements Action {
  readonly type = BACKUP_CHANNELS;
  constructor(public payload: {channelPoint: string, showMessage: string}) {}
}

export class VerifyChannels implements Action {
  readonly type = VERIFY_CHANNELS;
  constructor(public payload: {channelPoint: string}) {}
}

export class BackupChannelsRes implements Action {
  readonly type = BACKUP_CHANNELS_RES;
  constructor(public payload: string) {}
}

export class VerifyChannelsRes implements Action {
  readonly type = VERIFY_CHANNELS_RES;
  constructor(public payload: string) {}
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

export class FetchTransactions implements Action {
  readonly type = FETCH_TRANSACTIONS;
}

export class SetTransactions implements Action {
  readonly type = SET_TRANSACTIONS;
  constructor(public payload: Transaction[]) {}
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
  constructor(public payload: string) {} // payload = routeParam
}

export class SetDecodedPayment implements Action {
  readonly type = SET_DECODED_PAYMENT;
  constructor(public payload: PayRequest) {}
}

export class SendPayment implements Action {
  readonly type = SEND_PAYMENT;
  constructor(public payload: [string, PayRequest, boolean]) {} // payload = [paymentReqStr, paymentDecoded, EmptyAmtInvoice]
}

export class FetchGraphNode implements Action {
  readonly type = FETCH_GRAPH_NODE;
  constructor(public payload: string) {} // payload = pubkey
}

export class SetGraphNode implements Action {
  readonly type = SET_GRAPH_NODE;
  constructor(public payload: GraphNode) {}
}

export class GetNewAddress implements Action {
  readonly type = GET_NEW_ADDRESS;
  constructor(public payload: AddressType) {}
}

export class SetNewAddress implements Action {
  readonly type = SET_NEW_ADDRESS;
  constructor(public payload: string) {} // payload = newAddress
}

export class SetChannelTransaction implements Action {
  readonly type = SET_CHANNEL_TRANSACTION;
  constructor(public payload: ChannelsTransaction) {}
}

export class GenSeed implements Action {
  readonly type = GEN_SEED;
  constructor(public payload: string) {}
}

export class GenSeedResponse implements Action {
  readonly type = GEN_SEED_RESPONSE;
  constructor(public payload: Array<string>) {}
}

export class InitWallet implements Action {
  readonly type = INIT_WALLET;
  constructor(public payload: {pwd: string, cipher?: Array<string>, passphrase?: string}) {}
}

export class InitWalletResponse implements Action {
  readonly type = INIT_WALLET_RESPONSE;
  constructor(public payload: string) {}
}

export class UnlockWallet implements Action {
  readonly type = UNLOCK_WALLET;
  constructor(public payload: {pwd: string}) {}
}

export class FetchConfig implements Action {
  readonly type = FETCH_CONFIG;
  constructor(public payload: string) {} // payload = lnd/bitcoin node
}

export class ShowConfig implements Action {
  readonly type = SHOW_CONFIG;
  constructor(public payload: any) {} // payload = Config File
}

export class PeerLookup implements Action {
  readonly type = PEER_LOOKUP;
  constructor(public payload: string) {} // payload = pubkey
}

export class ChannelLookup implements Action {
  readonly type = CHANNEL_LOOKUP;
  constructor(public payload: string) {} // payload = chanID
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
  constructor(public payload: SwitchReq) {}
}

export class SetForwardingHistory implements Action {
  readonly type = SET_FORWARDING_HISTORY;
  constructor(public payload: SwitchRes) {}
}

export class GetQueryRoutes implements Action {
  readonly type = GET_QUERY_ROUTES;
  constructor(public payload: {destPubkey: string, amount: number}) {}
}

export class SetQueryRoutes implements Action {
  readonly type = SET_QUERY_ROUTES;
  constructor(public payload: QueryRoutes) {}
}

export type LNDActions =
  ResetLNDStore | FetchInfo | SetInfo | FetchPeers | SetPeers | AddPeer |
  DetachPeer | SaveNewPeer | RemovePeer | AddInvoice | SaveNewInvoice |
  GetForwardingHistory | SetForwardingHistory | FetchFees | SetFees |
  FetchBalance | SetBalance | FetchNetwork | SetNetwork |
  FetchChannels | SetChannels | SetPendingChannels | SetClosedChannels | UpdateChannels |
  SaveNewChannel | CloseChannel | RemoveChannel |
  BackupChannels | VerifyChannels | BackupChannelsRes | VerifyChannelsRes |
  FetchTransactions | SetTransactions |
  FetchInvoices | SetInvoices | SetTotalInvoices |
  FetchPayments | SetPayments | SendPayment |
  DecodePayment | SetDecodedPayment |
  FetchGraphNode | SetGraphNode | GetQueryRoutes | SetQueryRoutes |
  GetNewAddress | SetNewAddress | SetChannelTransaction |
  GenSeed | GenSeedResponse | InitWallet | InitWalletResponse | UnlockWallet |
  FetchConfig | ShowConfig | PeerLookup | ChannelLookup | InvoiceLookup | SetLookup;
