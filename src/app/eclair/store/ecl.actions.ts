import { createAction, props } from '@ngrx/store';

import { ECLActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, Fees, Peer, LightningBalance, OnChainBalance, ChannelsStatus, Payments, QueryRoutes, Transaction,
  SendPaymentOnChain, Invoice, PaymentReceived, ChannelStateUpdate, SaveChannel, UpdateChannel, CloseChannel, GetQueryRoutes,
  CreateInvoice, SendPayment, PaymentRelayed } from '../../shared/models/eclModels';
import { PageSettings } from '../../shared/models/pageSettings';

export const updateECLAPICallStatus = createAction(ECLActions.UPDATE_API_CALL_STATUS_ECL, props<{ payload: ApiCallStatusPayload }>());

export const resetECLStore = createAction(ECLActions.RESET_ECL_STORE, props<{ payload: SelNodeChild | null }>());

export const setChildNodeSettingsECL = createAction(ECLActions.SET_CHILD_NODE_SETTINGS_ECL, props<{ payload: SelNodeChild }>());

export const fetchPageSettings = createAction(ECLActions.FETCH_PAGE_SETTINGS_ECL);

export const setPageSettings = createAction(ECLActions.SET_PAGE_SETTINGS_ECL, props<{ payload: PageSettings[] }>());

export const savePageSettings = createAction(ECLActions.SAVE_PAGE_SETTINGS_ECL, props<{ payload: PageSettings[] }>());

export const fetchInfoECL = createAction(ECLActions.FETCH_INFO_ECL, props<{ payload: { loadPage: string } }>());

export const setInfo = createAction(ECLActions.SET_INFO_ECL, props<{ payload: GetInfo }>());

export const fetchFees = createAction(ECLActions.FETCH_FEES_ECL);

export const setFees = createAction(ECLActions.SET_FEES_ECL, props<{ payload: Fees }>());

export const fetchChannels = createAction(ECLActions.FETCH_CHANNELS_ECL, props<{ payload: { fetchPayments: boolean } }>());

export const setActiveChannels = createAction(ECLActions.SET_ACTIVE_CHANNELS_ECL, props<{ payload: Channel[] }>());

export const setPendingChannels = createAction(ECLActions.SET_PENDING_CHANNELS_ECL, props<{ payload: Channel[] }>());

export const setInactiveChannels = createAction(ECLActions.SET_INACTIVE_CHANNELS_ECL, props<{ payload: Channel[] }>());

export const fetchOnchainBalance = createAction(ECLActions.FETCH_ONCHAIN_BALANCE_ECL);

export const setOnchainBalance = createAction(ECLActions.SET_ONCHAIN_BALANCE_ECL, props<{ payload: OnChainBalance }>());

export const setLightningBalance = createAction(ECLActions.SET_LIGHTNING_BALANCE_ECL, props<{ payload: LightningBalance }>());

export const setChannelsStatus = createAction(ECLActions.SET_CHANNELS_STATUS_ECL, props<{ payload: ChannelsStatus }>());

export const fetchPeers = createAction(ECLActions.FETCH_PEERS_ECL);

export const setPeers = createAction(ECLActions.SET_PEERS_ECL, props<{ payload: Peer[] }>());

export const saveNewPeer = createAction(ECLActions.SAVE_NEW_PEER_ECL, props<{ payload: { id: string } }>());

export const newlyAddedPeer = createAction(ECLActions.NEWLY_ADDED_PEER_ECL, props<{ payload: { peer: Peer } }>());

export const addPeer = createAction(ECLActions.ADD_PEER_ECL, props<{ payload: Peer }>());

export const disconnectPeer = createAction(ECLActions.DETACH_PEER_ECL, props<{ payload: { nodeId: string } }>());

export const removePeer = createAction(ECLActions.REMOVE_PEER_ECL, props<{ payload: { nodeId: string } }>());

export const getNewAddress = createAction(ECLActions.GET_NEW_ADDRESS_ECL);

export const setNewAddress = createAction(ECLActions.SET_NEW_ADDRESS_ECL, props<{ payload: string }>());

export const saveNewChannel = createAction(ECLActions.SAVE_NEW_CHANNEL_ECL, props<{ payload: SaveChannel }>());

export const updateChannel = createAction(ECLActions.UPDATE_CHANNEL_ECL, props<{ payload: UpdateChannel }>());

export const closeChannel = createAction(ECLActions.CLOSE_CHANNEL_ECL, props<{ payload: CloseChannel }>());

export const removeChannel = createAction(ECLActions.REMOVE_CHANNEL_ECL, props<{ payload: { channelId: string } }>());

export const fetchPayments = createAction(ECLActions.FETCH_PAYMENTS_ECL);

export const setPayments = createAction(ECLActions.SET_PAYMENTS_ECL, props<{ payload: Payments }>());

export const getQueryRoutes = createAction(ECLActions.GET_QUERY_ROUTES_ECL, props<{ payload: GetQueryRoutes }>());

export const setQueryRoutes = createAction(ECLActions.SET_QUERY_ROUTES_ECL, props<{ payload: QueryRoutes[] }>());

export const sendPayment = createAction(ECLActions.SEND_PAYMENT_ECL, props<{ payload: SendPayment }>());

export const sendPaymentStatus = createAction(ECLActions.SEND_PAYMENT_STATUS_ECL, props<{ payload: any }>());

export const fetchTransactions = createAction(ECLActions.FETCH_TRANSACTIONS_ECL);

export const setTransactions = createAction(ECLActions.SET_TRANSACTIONS_ECL, props<{ payload: Transaction[] }>());

export const sendOnchainFunds = createAction(ECLActions.SEND_ONCHAIN_FUNDS_ECL, props<{ payload: SendPaymentOnChain }>());

export const sendOnchainFundsRes = createAction(ECLActions.SEND_ONCHAIN_FUNDS_RES_ECL, props<{ payload: any }>());

export const fetchInvoices = createAction(ECLActions.FETCH_INVOICES_ECL);

export const setInvoices = createAction(ECLActions.SET_INVOICES_ECL, props<{ payload: Invoice[] }>());

export const createInvoice = createAction(ECLActions.CREATE_INVOICE_ECL, props<{ payload: CreateInvoice }>());

export const addInvoice = createAction(ECLActions.ADD_INVOICE_ECL, props<{ payload: Invoice }>());

export const updateInvoice = createAction(ECLActions.UPDATE_INVOICE_ECL, props<{ payload: Invoice | PaymentReceived }>());

export const peerLookup = createAction(ECLActions.PEER_LOOKUP_ECL, props<{ payload: string }>());

export const invoiceLookup = createAction(ECLActions.INVOICE_LOOKUP_ECL, props<{ payload: string }>());

export const setLookup = createAction(ECLActions.SET_LOOKUP_ECL, props<{ payload: any }>());

export const updateChannelState = createAction(ECLActions.UPDATE_CHANNEL_STATE_ECL, props<{ payload: ChannelStateUpdate }>());

export const updateRelayedPayment = createAction(ECLActions.UPDATE_RELAYED_PAYMENT_ECL, props<{ payload: PaymentRelayed }>());
