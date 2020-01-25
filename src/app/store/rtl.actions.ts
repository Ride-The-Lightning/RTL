import { Action } from '@ngrx/store';

import { ErrorPayload } from '../shared/models/errorPayload';
import { DialogConfig } from '../shared/models/alertData';
import { RTLConfiguration, Settings, ConfigSettingsNode, GetInfoRoot, SelNodeChild } from '../shared/models/RTLconfig';
import { GetInfoCL, FeesCL, PeerCL, PaymentCL, PayRequestCL, QueryRoutesCL, ChannelCL, FeeRatesCL, ForwardingHistoryResCL, InvoiceCL, ListInvoicesCL, OnChainCL } from '../shared/models/clModels';
import {
  GetInfo, Peer, Balance, NetworkInfo, Fees, Channel, Invoice, ListInvoices, Payment, GraphNode,
  PayRequest, ChannelsTransaction, PendingChannels, ClosedChannel, Transaction, SwitchReq, SwitchRes, QueryRoutes, PendingChannelsGroup
} from '../shared/models/lndModels';

export const VOID = 'VOID';
export const UPDATE_SELECTED_NODE_OPTIONS = 'UPDATE_SELECTED_NODE_OPTIONS';
export const RESET_ROOT_STORE = 'RESET_ROOT_STORE';
export const CLEAR_EFFECT_ERROR_ROOT = 'CLEAR_EFFECT_ERROR_ROOT';
export const EFFECT_ERROR_ROOT = 'EFFECT_ERROR_ROOT';
export const OPEN_SNACK_BAR = 'OPEN_SNACKBAR';
export const OPEN_SPINNER = 'OPEN_SPINNER';
export const CLOSE_SPINNER = 'CLOSE_SPINNER';
export const OPEN_ALERT = 'OPEN_ALERT';
export const CLOSE_ALERT = 'CLOSE_ALERT';
export const OPEN_CONFIRMATION = 'OPEN_CONFIRMATION';
export const CLOSE_CONFIRMATION = 'CLOSE_CONFIRMATION';
export const SHOW_PUBKEY = 'SHOW_PUBKEY';
export const FETCH_STORE = 'FETCH_STORE';
export const SET_STORE = 'SET_STORE';
export const FETCH_RTL_CONFIG = 'FETCH_RTL_CONFIG';
export const SET_RTL_CONFIG = 'SET_RTL_CONFIG';
export const SAVE_SETTINGS = 'SAVE_SETTINGS';
export const SET_SELECTED_NODE = 'SET_SELECTED_NODE';
export const SET_NODE_DATA = 'SET_NODE_DATA';

export const RESET_LND_STORE = 'RESET_LND_STORE';
export const CLEAR_EFFECT_ERROR_LND = 'CLEAR_EFFECT_ERROR_LND';
export const EFFECT_ERROR_LND = 'EFFECT_ERROR_LND';
export const SET_CHILD_NODE_SETTINGS = 'SET_CHILD_NODE_SETTINGS';
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
export const FETCH_ALL_CHANNELS = 'FETCH_ALL_CHANNELS';
export const FETCH_PENDING_CHANNELS = 'FETCH_PENDING_CHANNELS';
export const FETCH_CLOSED_CHANNELS = 'FETCH_CLOSED_CHANNELS';
export const SET_ALL_CHANNELS = 'SET_ALL_CHANNELS';
export const SET_PENDING_CHANNELS = 'SET_PENDING_CHANNELS';
export const SET_CLOSED_CHANNELS = 'SET_CLOSED_CHANNELS';
export const UPDATE_CHANNELS = 'UPDATE_CHANNELS';
export const SAVE_NEW_CHANNEL = 'SAVE_NEW_CHANNEL';
export const CLOSE_CHANNEL = 'CLOSE_CHANNEL';
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL';
export const BACKUP_CHANNELS = 'BACKUP_CHANNELS';
export const VERIFY_CHANNELS = 'VERIFY_CHANNELS';
export const BACKUP_CHANNELS_RES = 'BACKUP_CHANNELS_RES';
export const VERIFY_CHANNELS_RES = 'VERIFY_CHANNELS_RES';
export const RESTORE_CHANNELS_LIST = 'RESTORE_CHANNELS_LIST';
export const SET_RESTORE_CHANNELS_LIST = 'SET_RESTORE_CHANNELS_LIST';
export const RESTORE_CHANNELS = 'RESTORE_CHANNELS';
export const RESTORE_CHANNELS_RES = 'RESTORE_CHANNELS_RES';
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
export const IS_AUTHORIZED = 'IS_AUTHORIZED';
export const IS_AUTHORIZED_RES = 'IS_AUTHORIZED_RES';
export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const RESET_PASSWORD = 'RESET_PASSWORD';
export const PEER_LOOKUP = 'PEER_LOOKUP';
export const CHANNEL_LOOKUP = 'CHANNEL_LOOKUP';
export const INVOICE_LOOKUP = 'INVOICE_LOOKUP';
export const SET_LOOKUP = 'SET_LOOKUP';
export const GET_FORWARDING_HISTORY = 'GET_FORWARDING_HISTORY';
export const SET_FORWARDING_HISTORY = 'SET_FORWARDING_HISTORY';
export const GET_QUERY_ROUTES = 'GET_QUERY_ROUTES';
export const SET_QUERY_ROUTES = 'SET_QUERY_ROUTES';

// export const LOOP_IN = 'LOOP_IN';
// export const GET_LOOP_IN_TERMS = 'GET_LOOP_IN_TERMS';
// export const SET_LOOP_IN_TERMS = 'SET_LOOP_IN_TERMS';
// export const GET_LOOP_IN_QUOTE = 'GET_LOOP_IN_QUOTE';
// export const SET_LOOP_IN_QUOTE = 'SET_LOOP_IN_QUOTE';
// export const LOOP_OUT = 'LOOP_OUT';
// export const GET_LOOP_OUT_TERMS = 'GET_LOOP_OUT_TERMS';
// export const SET_LOOP_OUT_TERMS = 'SET_LOOP_OUT_TERMS';
// export const GET_LOOP_OUT_QUOTE = 'GET_LOOP_OUT_QUOTE';
// export const SET_LOOP_OUT_QUOTE = 'SET_LOOP_OUT_QUOTE';

export const RESET_CL_STORE = 'RESET_CL_STORE';
export const CLEAR_EFFECT_ERROR_CL = 'CLEAR_EFFECT_ERROR_CL';
export const EFFECT_ERROR_CL = 'EFFECT_ERROR_CL';
export const SET_CHILD_NODE_SETTINGS_CL = 'SET_CHILD_NODE_SETTINGS_CL';
export const FETCH_INFO_CL = 'FETCH_INFO_CL';
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
export const FETCH_PEERS_CL = 'FETCH_PEERS_CL';
export const SET_PEERS_CL = 'SET_PEERS_CL';
export const SAVE_NEW_PEER_CL = 'SAVE_NEW_PEER_CL';
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
export const SEND_PAYMENT_CL = 'SEND_PAYMENT_CL';
export const SET_DECODED_PAYMENT_CL = 'SET_DECODED_PAYMENT_CL';
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

export class VoidAction implements Action {
  readonly type = VOID;
}

export class ClearEffectErrorRoot implements Action {
  readonly type = CLEAR_EFFECT_ERROR_ROOT;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectErrorRoot implements Action {
  readonly type = EFFECT_ERROR_ROOT;
  constructor(public payload: ErrorPayload) {}
}

export class ClearEffectErrorLnd implements Action {
  readonly type = CLEAR_EFFECT_ERROR_LND;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectErrorLnd implements Action {
  readonly type = EFFECT_ERROR_LND;
  constructor(public payload: ErrorPayload) {}
}

export class ClearEffectErrorCl implements Action {
  readonly type = CLEAR_EFFECT_ERROR_CL;
  constructor(public payload: string) {} // payload = errorAction
}

export class EffectErrorCl implements Action {
  readonly type = EFFECT_ERROR_CL;
  constructor(public payload: ErrorPayload) {}
}

export class OpenSnackBar implements Action {
  readonly type = OPEN_SNACK_BAR;
  constructor(public payload: string) {}
}

export class OpenSpinner implements Action {
  readonly type = OPEN_SPINNER;
  constructor(public payload: string) {} // payload = titleMessage
}

export class CloseSpinner implements Action {
  readonly type = CLOSE_SPINNER;
}

export class OpenAlert implements Action {
  readonly type = OPEN_ALERT;
  constructor(public payload: DialogConfig) {}
}

export class CloseAlert implements Action {
  readonly type = CLOSE_ALERT;
}

export class OpenConfirmation implements Action {
  readonly type = OPEN_CONFIRMATION;
  constructor(public payload: DialogConfig) {}
}

export class CloseConfirmation implements Action {
  readonly type = CLOSE_CONFIRMATION;
  constructor(public payload: boolean) {}
}

export class ShowPubkey implements Action {
  readonly type = SHOW_PUBKEY;
  constructor() {}
}

export class UpdateSelectedNodeOptions implements Action {
  readonly type = UPDATE_SELECTED_NODE_OPTIONS;
}

export class ResetRootStore implements Action {
  readonly type = RESET_ROOT_STORE;
  constructor(public payload: ConfigSettingsNode) {}
}

export class ResetLNDStore implements Action {
  readonly type = RESET_LND_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class ResetCLStore implements Action {
  readonly type = RESET_CL_STORE;
  constructor(public payload: SelNodeChild) {}
}

export class FetchRTLConfig implements Action {
  readonly type = FETCH_RTL_CONFIG;
}

export class SetRTLConfig implements Action {
  readonly type = SET_RTL_CONFIG;
  constructor(public payload: RTLConfiguration) {}
}

export class SaveSettings implements Action {
  readonly type = SAVE_SETTINGS;
  constructor(public payload: {settings: Settings, defaultNodeIndex?: number}) {}
}

export class SetSelelectedNode implements Action {
  readonly type = SET_SELECTED_NODE;
  constructor(public payload: { lnNode: ConfigSettingsNode, isInitialSetup: boolean }) {}
}

export class SetNodeData implements Action {
  readonly type = SET_NODE_DATA;
  constructor(public payload: GetInfoRoot) {}
}

export class SetChildNodeSettings implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfo implements Action {
  readonly type = FETCH_INFO;
  constructor(public payload: {loadPage: string}) {}
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
  constructor(public payload: {pubkey: string, host: string, perm: boolean, showOpenChannelModal: boolean}) {}
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

export class FetchAllChannels implements Action {
  readonly type = FETCH_ALL_CHANNELS;
}

export class SetAllChannels implements Action {
  readonly type = SET_ALL_CHANNELS;
  constructor(public payload: Channel[]) {}
}

export class FetchPendingChannels implements Action {
  readonly type = FETCH_PENDING_CHANNELS;
}

export class SetPendingChannels implements Action {
  readonly type = SET_PENDING_CHANNELS;
  constructor(public payload: {channels: PendingChannels, pendingChannels: PendingChannelsGroup}) {}
}

export class FetchClosedChannels implements Action {
  readonly type = FETCH_CLOSED_CHANNELS;
}

export class SetClosedChannels implements Action {
  readonly type = SET_CLOSED_CHANNELS;
  constructor(public payload: ClosedChannel[]) {}
}

export class UpdateChannels implements Action {
  readonly type = UPDATE_CHANNELS;
  constructor(public payload: any) {}
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

export class RestoreChannelsList implements Action {
  readonly type = RESTORE_CHANNELS_LIST;
}

export class SetRestoreChannelsList implements Action {
  readonly type = SET_RESTORE_CHANNELS_LIST;
  constructor(public payload: {all_restore_exists: boolean, files: []}) {}
}

export class RestoreChannels implements Action {
  readonly type = RESTORE_CHANNELS;
  constructor(public payload: {channelPoint: string}) {}
}

export class RestoreChannelsRes implements Action {
  readonly type = RESTORE_CHANNELS_RES;
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
  constructor(public payload: { paymentReq: string, paymentDecoded: PayRequest, zeroAmtInvoice: boolean, outgoingChannel?: Channel, feeLimitType?: {id: string, name: string}, feeLimit?: number }) {}
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
  constructor(public payload: { addressId?: string, addressCode?: string, addressTp?: string, addressDetails?: string}) {}
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

// export class LoopIn implements Action {
//   readonly type = LOOP_IN;
//   constructor(public payload: any) {}
// }

// export class GetLoopInTerms implements Action {
//   readonly type = GET_LOOP_IN_TERMS;
// }

// export class SetLoopInTerms implements Action {
//   readonly type = SET_LOOP_IN_TERMS;
//   constructor(public payload: any) {}
// }

// export class GetLoopInQuote implements Action {
//   readonly type = GET_LOOP_IN_QUOTE;
//   constructor(public payload: {amount: number}) {}
// }

// export class SetLoopInQuote implements Action {
//   readonly type = SET_LOOP_IN_QUOTE;
//   constructor(public payload: any) {}
// }

// export class LoopOut implements Action {
//   readonly type = LOOP_OUT;
//   constructor(public payload: any) {}
// }

// export class GetLoopOutTerms implements Action {
//   readonly type = GET_LOOP_OUT_TERMS;
// }

// export class SetLoopOutTerms implements Action {
//   readonly type = SET_LOOP_OUT_TERMS;
//   constructor(public payload: any) {}
// }

// export class GetLoopOutQuote implements Action {
//   readonly type = GET_LOOP_OUT_QUOTE;
//   constructor(public payload: {amount: number}) {}
// }

// export class SetLoopOutQuote implements Action {
//   readonly type = SET_LOOP_OUT_QUOTE;
//   constructor(public payload: any) {}
// }

export class IsAuthorized implements Action {
  readonly type = IS_AUTHORIZED;
  constructor(public payload: string) {} // payload = password
}

export class IsAuthorizedRes implements Action {
  readonly type = IS_AUTHORIZED_RES;
  constructor(public payload: any) {} // payload = token/error
}

export class Login implements Action {
  readonly type = LOGIN;
  constructor(public payload: {password: string, initialPass: boolean}) {}
}

export class Logout implements Action {
  readonly type = LOGOUT;
  constructor() {}
}

export class ResetPassword implements Action {
  readonly type = RESET_PASSWORD;
  constructor(public payload: {oldPassword: string, newPassword: string}) {}
}

export class SetChildNodeSettingsCL implements Action {
  readonly type = SET_CHILD_NODE_SETTINGS_CL;
  constructor(public payload: SelNodeChild) {}
}

export class FetchInfoCL implements Action {
  readonly type = FETCH_INFO_CL;
  constructor(public payload: {loadPage: string}) {}
}

export class SetInfoCL implements Action {
  readonly type = SET_INFO_CL;
  constructor(public payload: GetInfoCL) {}
}

export class FetchFeesCL implements Action {
  readonly type = FETCH_FEES_CL;
}

export class SetFeesCL implements Action {
  readonly type = SET_FEES_CL;
  constructor(public payload: FeesCL) {}
}

export class FetchFeeRatesCL implements Action {
  readonly type = FETCH_FEE_RATES_CL;
  constructor(public payload: string) {} //feeRateStyle
}

export class SetFeeRatesCL implements Action {
  readonly type = SET_FEE_RATES_CL;
  constructor(public payload: FeeRatesCL) {}
}

export class FetchBalanceCL implements Action {
  readonly type = FETCH_BALANCE_CL;
}

export class SetBalanceCL implements Action {
  readonly type = SET_BALANCE_CL;
  constructor(public payload: {}) {}
}

export class FetchLocalRemoteBalanceCL implements Action {
  readonly type = FETCH_LOCAL_REMOTE_BALANCE_CL;
}

export class SetLocalRemoteBalanceCL implements Action {
  readonly type = SET_LOCAL_REMOTE_BALANCE_CL;
  constructor(public payload: {localBalance: number, remoteBalance: number}) {}
}

export class GetNewAddressCL implements Action {
  readonly type = GET_NEW_ADDRESS_CL;
  constructor(public payload: { addressId?: string, addressCode?: string, addressTp?: string, addressDetails?: string}) {}
}

export class SetNewAddressCL implements Action {
  readonly type = SET_NEW_ADDRESS_CL;
  constructor(public payload: string) {} // payload = newAddress
}

export class FetchPeersCL implements Action {
  readonly type = FETCH_PEERS_CL;
}

export class SetPeersCL implements Action {
  readonly type = SET_PEERS_CL;
  constructor(public payload: PeerCL[]) {}
}

export class SaveNewPeerCL implements Action {
  readonly type = SAVE_NEW_PEER_CL;
  constructor(public payload: {id: string, showOpenChannelModal: boolean}) {}
}

export class AddPeerCL implements Action {
  readonly type = ADD_PEER_CL;
  constructor(public payload: PeerCL) {}
}

export class DetachPeerCL implements Action {
  readonly type = DETACH_PEER_CL;
  constructor(public payload: {id: string, force: boolean}) {}
}

export class RemovePeerCL implements Action {
  readonly type = REMOVE_PEER_CL;
  constructor(public payload: {id: string}) {}
}

export class FetchPaymentsCL implements Action {
  readonly type = FETCH_PAYMENTS_CL;
}

export class SetPaymentsCL implements Action {
  readonly type = SET_PAYMENTS_CL;
  constructor(public payload: PaymentCL[]) {}
}

export class DecodePaymentCL implements Action {
  readonly type = DECODE_PAYMENT_CL;
  constructor(public payload: string) {} // payload = routeParam
}

export class SetDecodedPaymentCL implements Action {
  readonly type = SET_DECODED_PAYMENT_CL;
  constructor(public payload: PayRequestCL) {}
}

export class SendPaymentCL implements Action {
  readonly type = SEND_PAYMENT_CL;
  constructor(public payload: { invoice: string, amount?: number }) {}
}

export class GetQueryRoutesCL implements Action {
  readonly type = GET_QUERY_ROUTES_CL;
  constructor(public payload: {destPubkey: string, amount: number}) {}
}

export class SetQueryRoutesCL implements Action {
  readonly type = SET_QUERY_ROUTES_CL;
  constructor(public payload: QueryRoutesCL) {}
}

export class FetchChannelsCL implements Action {
  readonly type = FETCH_CHANNELS_CL;
}

export class SetChannelsCL implements Action {
  readonly type = SET_CHANNELS_CL;
  constructor(public payload: ChannelCL[]) {}
}

export class UpdateChannelsCL implements Action {
  readonly type = UPDATE_CHANNELS_CL;
  constructor(public payload: {channelId: string, baseFeeMsat: number, feeRate: number}) {}
}

export class SaveNewChannelCL implements Action {
  readonly type = SAVE_NEW_CHANNEL_CL;
  constructor(public payload: {peerId: string, satoshis: number, feeRate: string, announce: boolean, minconf?: number}) {}
}

export class CloseChannelCL implements Action {
  readonly type = CLOSE_CHANNEL_CL;
  constructor(public payload: {channelId: string, timeoutSec?: number}) {}
}

export class RemoveChannelCL implements Action {
  readonly type = REMOVE_CHANNEL_CL;
  constructor(public payload: {channelId: string}) {}
}

export class PeerLookupCL implements Action {
  readonly type = PEER_LOOKUP_CL;
  constructor(public payload: string) {} // payload = id
}

export class ChannelLookupCL implements Action {
  readonly type = CHANNEL_LOOKUP_CL;
  constructor(public payload: {shortChannelID: string, showError: boolean}) {}
}

export class InvoiceLookupCL implements Action {
  readonly type = INVOICE_LOOKUP_CL;
  constructor(public payload: string) {} // payload = rHashStr
}

export class SetLookupCL implements Action {
  readonly type = SET_LOOKUP_CL;
  constructor(public payload: any) {} // payload = lookup Response (Peer/Channel/Invoice)
}

export class GetForwardingHistoryCL implements Action {
  readonly type = GET_FORWARDING_HISTORY_CL;
  // constructor(public payload: SwitchReq) {}
}

export class SetForwardingHistoryCL implements Action {
  readonly type = SET_FORWARDING_HISTORY_CL;
  constructor(public payload: ForwardingHistoryResCL) {}
}

export class FetchInvoicesCL implements Action {
  readonly type = FETCH_INVOICES_CL;
  constructor(public payload: {num_max_invoices?: number, index_offset?: number, reversed?: boolean}) {}
}

export class SetInvoicesCL implements Action {
  readonly type = SET_INVOICES_CL;
  constructor(public payload: ListInvoicesCL) {}
}

export class SetTotalInvoicesCL implements Action {
  readonly type = SET_TOTAL_INVOICES_CL;
  constructor(public payload: number) {}
}

export class SaveNewInvoiceCL implements Action {
  readonly type = SAVE_NEW_INVOICE_CL;
  constructor(public payload: {amount: number, label: string, description: string, expiry: number, private: boolean}) {}
}

export class AddInvoiceCL implements Action {
  readonly type = ADD_INVOICE_CL;
  constructor(public payload: InvoiceCL) {}
}

export class DeleteExpiredInvoiceCL implements Action {
  readonly type = DELETE_EXPIRED_INVOICE_CL;
  constructor(public payload?: number) {} // maxexpiry
}

export class SetChannelTransactionCL implements Action {
  readonly type = SET_CHANNEL_TRANSACTION_CL;
  constructor(public payload: OnChainCL) {}
}

export type RTLActions =
  ClearEffectErrorRoot | EffectErrorRoot | ClearEffectErrorLnd | EffectErrorLnd | ClearEffectErrorCl | EffectErrorCl |
  VoidAction | OpenSnackBar | OpenSpinner | CloseSpinner | FetchRTLConfig | SetRTLConfig | SaveSettings |
  OpenAlert | CloseAlert |  OpenConfirmation | CloseConfirmation | ShowPubkey |
  UpdateSelectedNodeOptions | ResetRootStore | ResetLNDStore | ResetCLStore |
  SetSelelectedNode | SetNodeData | SetChildNodeSettings | FetchInfo | SetInfo |
  FetchPeers | SetPeers | AddPeer | DetachPeer | SaveNewPeer | RemovePeer |
  AddInvoice | SaveNewInvoice | GetForwardingHistory | SetForwardingHistory |
  FetchFees | SetFees |
  FetchBalance | SetBalance |
  FetchNetwork | SetNetwork |
  FetchAllChannels | SetAllChannels | FetchPendingChannels | SetPendingChannels | FetchClosedChannels | SetClosedChannels | UpdateChannels |
  SaveNewChannel | CloseChannel | RemoveChannel |
  BackupChannels | VerifyChannels | BackupChannelsRes | VerifyChannelsRes |
  RestoreChannels | RestoreChannelsRes | RestoreChannelsList | SetRestoreChannelsList |
  FetchTransactions | SetTransactions |
  FetchInvoices | SetInvoices | SetTotalInvoices |
  FetchPayments | SetPayments | SendPayment |
  DecodePayment | SetDecodedPayment |
  FetchGraphNode | SetGraphNode | GetQueryRoutes | SetQueryRoutes |
  GetNewAddress | SetNewAddress | SetChannelTransaction |
  GenSeed | GenSeedResponse | InitWallet | InitWalletResponse | UnlockWallet |
  FetchConfig | ShowConfig | PeerLookup | ChannelLookup | InvoiceLookup | SetLookup |
  // LoopIn | GetLoopInTerms | SetLoopInTerms | GetLoopInQuote | SetLoopInQuote |
  // LoopOut | GetLoopOutTerms | SetLoopOutTerms | GetLoopOutQuote | SetLoopOutQuote |
  IsAuthorized | IsAuthorizedRes | Login | Logout | ResetPassword |
  SetChildNodeSettingsCL | FetchInfoCL | SetInfoCL | FetchFeesCL | SetFeesCL | FetchFeeRatesCL | SetFeeRatesCL |
  FetchBalanceCL | SetBalanceCL | FetchLocalRemoteBalanceCL | SetLocalRemoteBalanceCL |
  GetNewAddressCL | SetNewAddressCL |
  FetchPeersCL | SetPeersCL | AddPeerCL | DetachPeerCL | SaveNewPeerCL | RemovePeerCL |
  FetchChannelsCL | SetChannelsCL | UpdateChannelsCL | SaveNewChannelCL | CloseChannelCL | RemoveChannelCL |
  FetchPaymentsCL | SetPaymentsCL | SendPaymentCL | DecodePaymentCL | SetDecodedPaymentCL |
  GetQueryRoutesCL | SetQueryRoutesCL | SetChannelTransactionCL |
  PeerLookupCL | ChannelLookupCL | InvoiceLookupCL | SetLookupCL |
  GetForwardingHistoryCL | SetForwardingHistoryCL |
  FetchInvoicesCL | SetInvoicesCL | SetTotalInvoicesCL | SaveNewInvoiceCL | AddInvoiceCL | DeleteExpiredInvoiceCL;
