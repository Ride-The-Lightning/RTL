import { createAction, props } from '@ngrx/store';

import { CLNActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, Peer, Payment, QueryRoutes, Channel, FeeRates, ForwardingEvent, Invoice, ListInvoices, OnChain, UTXO, SaveChannel, GetNewAddress, DetachPeer, UpdateChannel, CloseChannel, SendPayment, GetQueryRoutes, ChannelLookup, OfferInvoice, Offer, OfferBookmark, LocalFailedEvent } from '../../shared/models/clModels';

export const updateCLAPICallStatus = createAction(CLNActions.UPDATE_API_CALL_STATUS_CLN, props<{ payload: ApiCallStatusPayload }>());

export const resetCLStore = createAction(CLNActions.RESET_CLN_STORE, props<{ payload: SelNodeChild }>());

export const setChildNodeSettingsCL = createAction(CLNActions.SET_CHILD_NODE_SETTINGS_CLN, props<{ payload: SelNodeChild }>());

export const fetchInfoCL = createAction(CLNActions.FETCH_INFO_CLN, props<{ payload: { loadPage: string } }>());

export const setInfo = createAction(CLNActions.SET_INFO_CLN, props<{ payload: GetInfo }>());

export const fetchFees = createAction(CLNActions.FETCH_FEES_CLN);

export const setFees = createAction(CLNActions.SET_FEES_CLN, props<{ payload: Fees }>());

export const fetchFeeRates = createAction(CLNActions.FETCH_FEE_RATES_CLN, props<{ payload: string }>());

export const setFeeRates = createAction(CLNActions.SET_FEE_RATES_CLN, props<{ payload: FeeRates }>());

export const fetchBalance = createAction(CLNActions.FETCH_BALANCE_CLN);

export const setBalance = createAction(CLNActions.SET_BALANCE_CLN, props<{ payload: any }>());

export const fetchLocalRemoteBalance = createAction(CLNActions.FETCH_LOCAL_REMOTE_BALANCE_CLN);

export const setLocalRemoteBalance = createAction(CLNActions.SET_LOCAL_REMOTE_BALANCE_CLN, props<{ payload: { localBalance: number, remoteBalance: number } }>());

export const getNewAddress = createAction(CLNActions.GET_NEW_ADDRESS_CLN, props<{ payload: GetNewAddress }>());

export const setNewAddress = createAction(CLNActions.SET_NEW_ADDRESS_CLN, props<{ payload: string }>());

export const fetchPeers = createAction(CLNActions.FETCH_PEERS_CLN);

export const setPeers = createAction(CLNActions.SET_PEERS_CLN, props<{ payload: Peer[] }>());

export const saveNewPeer = createAction(CLNActions.SAVE_NEW_PEER_CLN, props<{ payload: { id: string } }>());

export const newlyAddedPeer = createAction(CLNActions.NEWLY_ADDED_PEER_CLN, props<{ payload: { peer: Peer, balance: number } }>());

export const addPeer = createAction(CLNActions.ADD_PEER_CLN, props<{ payload: Peer }>());

export const detachPeer = createAction(CLNActions.DETACH_PEER_CLN, props<{ payload: DetachPeer }>());

export const removePeer = createAction(CLNActions.REMOVE_PEER_CLN, props<{ payload: { id: string } }>());

export const fetchPayments = createAction(CLNActions.FETCH_PAYMENTS_CLN);

export const setPayments = createAction(CLNActions.SET_PAYMENTS_CLN, props<{ payload: Payment[] }>());

export const sendPayment = createAction(CLNActions.SEND_PAYMENT_CLN, props<{ payload: SendPayment }>());

export const sendPaymentStatus = createAction(CLNActions.SEND_PAYMENT_STATUS_CLN, props<{ payload: any }>());

export const getQueryRoutes = createAction(CLNActions.GET_QUERY_ROUTES_CLN, props<{ payload: GetQueryRoutes }>());

export const setQueryRoutes = createAction(CLNActions.SET_QUERY_ROUTES_CLN, props<{ payload: QueryRoutes }>());

export const fetchChannels = createAction(CLNActions.FETCH_CHANNELS_CLN);

export const setChannels = createAction(CLNActions.SET_CHANNELS_CLN, props<{ payload: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[] } }>());

export const updateChannel = createAction(CLNActions.UPDATE_CHANNEL_CLN, props<{ payload: UpdateChannel }>());

export const saveNewChannel = createAction(CLNActions.SAVE_NEW_CHANNEL_CLN, props<{ payload: SaveChannel }>());

export const closeChannel = createAction(CLNActions.CLOSE_CHANNEL_CLN, props<{ payload: CloseChannel }>());

export const removeChannel = createAction(CLNActions.REMOVE_CHANNEL_CLN, props<{ payload: CloseChannel }>());

export const peerLookup = createAction(CLNActions.PEER_LOOKUP_CLN, props<{ payload: string }>());

export const channelLookup = createAction(CLNActions.CHANNEL_LOOKUP_CLN, props<{ payload: ChannelLookup }>());

export const invoiceLookup = createAction(CLNActions.INVOICE_LOOKUP_CLN, props<{ payload: string }>());

export const setLookup = createAction(CLNActions.SET_LOOKUP_CLN, props<{ payload: any }>());

export const getForwardingHistory = createAction(CLNActions.GET_FORWARDING_HISTORY_CLN, props<{ payload: { status: string } }>());

export const setForwardingHistory = createAction(CLNActions.SET_FORWARDING_HISTORY_CLN, props<{ payload: ForwardingEvent[] }>());

export const getFailedForwardingHistory = createAction(CLNActions.GET_FAILED_FORWARDING_HISTORY_CLN);

export const setFailedForwardingHistory = createAction(CLNActions.SET_FAILED_FORWARDING_HISTORY_CLN, props<{ payload: ForwardingEvent[] }>());

export const getLocalFailedForwardingHistory = createAction(CLNActions.GET_LOCAL_FAILED_FORWARDING_HISTORY_CLN);

export const setLocalFailedForwardingHistory = createAction(CLNActions.SET_LOCAL_FAILED_FORWARDING_HISTORY_CLN, props<{ payload: LocalFailedEvent[] }>());

export const fetchInvoices = createAction(CLNActions.FETCH_INVOICES_CLN, props<{ payload: { num_max_invoices?: number, index_offset?: number, reversed?: boolean } }>());

export const setInvoices = createAction(CLNActions.SET_INVOICES_CLN, props<{ payload: ListInvoices }>());

export const saveNewInvoice = createAction(CLNActions.SAVE_NEW_INVOICE_CLN, props<{ payload: { amount: number, label: string, description: string, expiry: number, private: boolean } }>());

export const addInvoice = createAction(CLNActions.ADD_INVOICE_CLN, props<{ payload: Invoice }>());

export const updateInvoice = createAction(CLNActions.UPDATE_INVOICE_CLN, props<{ payload: Invoice }>());

export const deleteExpiredInvoice = createAction(CLNActions.DELETE_EXPIRED_INVOICE_CLN, props<{ payload?: number }>());

export const setChannelTransaction = createAction(CLNActions.SET_CHANNEL_TRANSACTION_CLN, props<{ payload: OnChain }>());

export const setChannelTransactionRes = createAction(CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN, props<{ payload: any }>());

export const fetchUTXOs = createAction(CLNActions.FETCH_UTXOS_CLN);

export const setUTXOs = createAction(CLNActions.SET_UTXOS_CLN, props<{ payload: UTXO[] }>());

export const fetchOfferInvoice = createAction(CLNActions.FETCH_OFFER_INVOICE_CLN, props<{ payload: { offer: string, msatoshi?: number } }>());

export const setOfferInvoice = createAction(CLNActions.SET_OFFER_INVOICE_CLN, props<{ payload: OfferInvoice }>());

export const fetchOffers = createAction(CLNActions.FETCH_OFFERS_CLN);

export const setOffers = createAction(CLNActions.SET_OFFERS_CLN, props<{ payload: Offer[] }>());

export const saveNewOffer = createAction(CLNActions.SAVE_NEW_OFFER_CLN, props<{ payload: { amount: string, description: string, vendor: string } }>());

export const addOffer = createAction(CLNActions.ADD_OFFER_CLN, props<{ payload: Offer }>());

export const disableOffer = createAction(CLNActions.DISABLE_OFFER_CLN, props<{ payload: { offer_id: string } }>());

export const updateOffer = createAction(CLNActions.UPDATE_OFFER_CLN, props<{ payload: { offer: Offer } }>());

export const fetchOfferBookmarks = createAction(CLNActions.FETCH_OFFER_BOOKMARKS_CLN);

export const setOfferBookmarks = createAction(CLNActions.SET_OFFER_BOOKMARKS_CLN, props<{ payload: OfferBookmark[] }>());

export const addUpdateOfferBookmark = createAction(CLNActions.ADD_UPDATE_OFFER_BOOKMARK_CLN, props<{ payload: OfferBookmark }>());

export const deleteOfferBookmark = createAction(CLNActions.DELETE_OFFER_BOOKMARK_CLN, props<{ payload: { bolt12: string } }>());

export const removeOfferBookmark = createAction(CLNActions.REMOVE_OFFER_BOOKMARK_CLN, props<{ payload: { bolt12: string } }>());
