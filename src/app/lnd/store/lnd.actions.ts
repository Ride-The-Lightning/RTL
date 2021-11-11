import { createAction, props } from '@ngrx/store';

import { LNDActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import {
  GetInfo, Peer, Balance, NetworkInfo, Fees, Channel, Invoice, ListInvoices,
  ChannelsTransaction, PendingChannels, ClosedChannel, Transaction, SwitchReq,
  SwitchRes, QueryRoutes, PendingChannelsGroup, LightningNode, UTXO, ListPayments, SavePeer, SaveInvoice, SaveChannel, CloseChannel, FetchInvoices, FetchPayments, SendPayment, GetNewAddress, GetQueryRoutes, InitWallet, ChannelLookup, SetRestoreChannelsList, NewlyAddedPeer, SetBalance, SetPendingChannels, BackupChannels, SetAllLightningTransactions
}
  from '../../shared/models/lndModels';

export const updateLNDAPICallStatus = createAction(LNDActions.UPDATE_API_CALL_STATUS_LND, props<{ payload: ApiCallStatusPayload }>());

export const resetLNDStore = createAction(LNDActions.RESET_LND_STORE, props<{ payload: SelNodeChild }>());

export const setChildNodeSettingsLND = createAction(LNDActions.SET_CHILD_NODE_SETTINGS_LND, props<{ payload: SelNodeChild }>());

export const fetchInfoLND = createAction(LNDActions.FETCH_INFO_LND, props<{ payload: { loadPage: string } }>());

export const setInfo = createAction(LNDActions.SET_INFO_LND, props<{ payload: GetInfo }>());

export const fetchPeers = createAction(LNDActions.FETCH_PEERS_LND);

export const setPeers = createAction(LNDActions.SET_PEERS_LND, props<{ payload: Peer[] }>());

export const saveNewPeer = createAction(LNDActions.SAVE_NEW_PEER_LND, props<{ payload: SavePeer }>());

export const newlyAddedPeer = createAction(LNDActions.NEWLY_ADDED_PEER_LND, props<{ payload: NewlyAddedPeer }>());

export const detachPeer = createAction(LNDActions.DETACH_PEER_LND, props<{ payload: { pubkey: string } }>());

export const removePeer = createAction(LNDActions.REMOVE_PEER_LND, props<{ payload: { pubkey: string } }>());

export const saveNewInvoice = createAction(LNDActions.SAVE_NEW_INVOICE_LND, props<{ payload: SaveInvoice }>());

export const newlySavedInvoice = createAction(LNDActions.NEWLY_SAVED_INVOICE_LND, props<{ payload: { paymentRequest: string } }>());

export const addInvoice = createAction(LNDActions.ADD_INVOICE_LND, props<{ payload: Invoice }>());

export const fetchFees = createAction(LNDActions.FETCH_FEES_LND);

export const setFees = createAction(LNDActions.SET_FEES_LND, props<{ payload: Fees }>());

export const fetchBalance = createAction(LNDActions.FETCH_BALANCE_LND, props<{ payload: string }>());

export const setBalance = createAction(LNDActions.SET_BALANCE_LND, props<{ payload: SetBalance }>());

export const fetchNetwork = createAction(LNDActions.FETCH_NETWORK_LND);

export const setNetwork = createAction(LNDActions.SET_NETWORK_LND, props<{ payload: NetworkInfo }>());

export const fetchAllChannels = createAction(LNDActions.FETCH_ALL_CHANNELS_LND);

export const setAllChannels = createAction(LNDActions.SET_ALL_CHANNELS_LND, props<{ payload: Channel[] }>());

export const fetchPendingChannels = createAction(LNDActions.FETCH_PENDING_CHANNELS_LND);

export const setPendingChannels = createAction(LNDActions.SET_PENDING_CHANNELS_LND, props<{ payload: SetPendingChannels }>());

export const fetchClosedChannels = createAction(LNDActions.FETCH_CLOSED_CHANNELS_LND);

export const setClosedChannels = createAction(LNDActions.SET_CLOSED_CHANNELS_LND, props<{ payload: ClosedChannel[] }>());

export const updateChannel = createAction(LNDActions.UPDATE_CHANNEL_LND, props<{ payload: any }>());

export const saveNewChannel = createAction(LNDActions.SAVE_NEW_CHANNEL_LND, props<{ payload: SaveChannel }>());

export const closeChannel = createAction(LNDActions.CLOSE_CHANNEL_LND, props<{ payload: CloseChannel }>());

export const removeChannel = createAction(LNDActions.REMOVE_CHANNEL_LND, props<{ payload: { channelPoint: string } }>());

export const backupChannels = createAction(LNDActions.BACKUP_CHANNELS_LND, props<{ payload: BackupChannels }>());

export const verifyChannel = createAction(LNDActions.VERIFY_CHANNEL_LND, props<{ payload: { channelPoint: string } }>());

export const backupChannelsRes = createAction(LNDActions.BACKUP_CHANNELS_RES_LND, props<{ payload: string }>());

export const verifyChannelRes = createAction(LNDActions.VERIFY_CHANNEL_RES_LND, props<{ payload: string }>());

export const restoreChannelsList = createAction(LNDActions.RESTORE_CHANNELS_LIST_LND);

export const setRestoreChannelsList = createAction(LNDActions.SET_RESTORE_CHANNELS_LIST_LND, props<{ payload: SetRestoreChannelsList }>());

export const restoreChannels = createAction(LNDActions.RESTORE_CHANNELS_LND, props<{ payload: { channelPoint: string } }>());

export const restoreChannelsRes = createAction(LNDActions.RESTORE_CHANNELS_RES_LND, props<{ payload: string }>());

export const fetchInvoices = createAction(LNDActions.FETCH_INVOICES_LND, props<{ payload: FetchInvoices }>());

export const setInvoices = createAction(LNDActions.SET_INVOICES_LND, props<{ payload: ListInvoices }>());

export const updateInvoice = createAction(LNDActions.UPDATE_INVOICE_LND, props<{ payload: Invoice }>());

export const setTotalInvoices = createAction(LNDActions.SET_TOTAL_INVOICES_LND, props<{ payload: number }>());

export const fetchTransactions = createAction(LNDActions.FETCH_TRANSACTIONS_LND);

export const setTransactions = createAction(LNDActions.SET_TRANSACTIONS_LND, props<{ payload: Transaction[] }>());

export const fetchUTXOs = createAction(LNDActions.FETCH_UTXOS_LND);

export const setUTXOs = createAction(LNDActions.SET_UTXOS_LND, props<{ payload: UTXO[] }>());

export const fetchPayments = createAction(LNDActions.FETCH_PAYMENTS_LND, props<{ payload: FetchPayments }>());

export const setPayments = createAction(LNDActions.SET_PAYMENTS_LND, props<{ payload: ListPayments }>());

export const sendPayment = createAction(LNDActions.SEND_PAYMENT_LND, props<{ payload: SendPayment }>());

export const sendPaymentStatus = createAction(LNDActions.SEND_PAYMENT_STATUS_LND, props<{ payload: any }>());

export const fetchGraphNode = createAction(LNDActions.FETCH_GRAPH_NODE_LND, props<{ payload: { pubkey: string } }>());

export const setGraphNode = createAction(LNDActions.SET_GRAPH_NODE_LND, props<{ payload: { node: LightningNode } }>());

export const getNewAddress = createAction(LNDActions.GET_NEW_ADDRESS_LND, props<{ payload: GetNewAddress }>());

export const setNewAddress = createAction(LNDActions.SET_NEW_ADDRESS_LND, props<{ payload: string }>());

export const setChannelTransaction = createAction(LNDActions.SET_CHANNEL_TRANSACTION_LND, props<{ payload: ChannelsTransaction }>());

export const setChannelTransactionRes = createAction(LNDActions.SET_CHANNEL_TRANSACTION_RES_LND, props<{ payload: any }>());

export const genSeed = createAction(LNDActions.GEN_SEED_LND, props<{ payload: string }>());

export const genSeedResponse = createAction(LNDActions.GEN_SEED_RESPONSE_LND, props<{ payload: Array<string> }>());

export const initWallet = createAction(LNDActions.INIT_WALLET_LND, props<{ payload: InitWallet }>());

export const initWalletResponse = createAction(LNDActions.INIT_WALLET_RESPONSE_LND, props<{ payload: string }>());

export const unlockWallet = createAction(LNDActions.UNLOCK_WALLET_LND, props<{ payload: { pwd: string } }>());

export const peerLookup = createAction(LNDActions.PEER_LOOKUP_LND, props<{ payload: string }>());

export const channelLookup = createAction(LNDActions.CHANNEL_LOOKUP_LND, props<{ payload: ChannelLookup }>());

export const invoiceLookup = createAction(LNDActions.INVOICE_LOOKUP_LND, props<{ payload: string }>());

export const setLookup = createAction(LNDActions.SET_LOOKUP_LND, props<{ payload: any }>());

export const getForwardingHistory = createAction(LNDActions.GET_FORWARDING_HISTORY_LND, props<{ payload: SwitchReq }>());

export const setForwardingHistory = createAction(LNDActions.SET_FORWARDING_HISTORY_LND, props<{ payload: SwitchRes }>());

export const getQueryRoutes = createAction(LNDActions.GET_QUERY_ROUTES_LND, props<{ payload: GetQueryRoutes }>());

export const setQueryRoutes = createAction(LNDActions.SET_QUERY_ROUTES_LND, props<{ payload: QueryRoutes }>());

export const getAllLightningTransactions = createAction(LNDActions.GET_ALL_LIGHTNING_TRANSATIONS_LND);

export const setAllLightningTransactions = createAction(LNDActions.SET_ALL_LIGHTNING_TRANSATIONS_LND, props<{ payload: SetAllLightningTransactions }>());
