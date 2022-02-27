import { createAction, props } from '@ngrx/store';

import { CLActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Fees, Peer, Payment, QueryRoutes, Channel, FeeRates, ForwardingEvent, Invoice, ListInvoices, OnChain, UTXO, SaveChannel, GetNewAddress, DetachPeer, UpdateChannel, CloseChannel, SendPayment, GetQueryRoutes, ChannelLookup, OfferInvoice, Offer, OfferBookmark, LocalFailedEvent } from '../../shared/models/clModels';

export const updateCLAPICallStatus = createAction(CLActions.UPDATE_API_CALL_STATUS_CL, props<{ payload: ApiCallStatusPayload }>());

export const resetCLStore = createAction(CLActions.RESET_CL_STORE, props<{ payload: SelNodeChild }>());

export const setChildNodeSettingsCL = createAction(CLActions.SET_CHILD_NODE_SETTINGS_CL, props<{ payload: SelNodeChild }>());

export const fetchInfoCL = createAction(CLActions.FETCH_INFO_CL, props<{ payload: { loadPage: string } }>());

export const setInfo = createAction(CLActions.SET_INFO_CL, props<{ payload: GetInfo }>());

export const fetchFees = createAction(CLActions.FETCH_FEES_CL);

export const setFees = createAction(CLActions.SET_FEES_CL, props<{ payload: Fees }>());

export const fetchFeeRates = createAction(CLActions.FETCH_FEE_RATES_CL, props<{ payload: string }>());

export const setFeeRates = createAction(CLActions.SET_FEE_RATES_CL, props<{ payload: FeeRates }>());

export const fetchBalance = createAction(CLActions.FETCH_BALANCE_CL);

export const setBalance = createAction(CLActions.SET_BALANCE_CL, props<{ payload: any }>());

export const fetchLocalRemoteBalance = createAction(CLActions.FETCH_LOCAL_REMOTE_BALANCE_CL);

export const setLocalRemoteBalance = createAction(CLActions.SET_LOCAL_REMOTE_BALANCE_CL, props<{ payload: { localBalance: number, remoteBalance: number } }>());

export const getNewAddress = createAction(CLActions.GET_NEW_ADDRESS_CL, props<{ payload: GetNewAddress }>());

export const setNewAddress = createAction(CLActions.SET_NEW_ADDRESS_CL, props<{ payload: string }>());

export const fetchPeers = createAction(CLActions.FETCH_PEERS_CL);

export const setPeers = createAction(CLActions.SET_PEERS_CL, props<{ payload: Peer[] }>());

export const saveNewPeer = createAction(CLActions.SAVE_NEW_PEER_CL, props<{ payload: { id: string } }>());

export const newlyAddedPeer = createAction(CLActions.NEWLY_ADDED_PEER_CL, props<{ payload: { peer: Peer, balance: number } }>());

export const addPeer = createAction(CLActions.ADD_PEER_CL, props<{ payload: Peer }>());

export const detachPeer = createAction(CLActions.DETACH_PEER_CL, props<{ payload: DetachPeer }>());

export const removePeer = createAction(CLActions.REMOVE_PEER_CL, props<{ payload: { id: string } }>());

export const fetchPayments = createAction(CLActions.FETCH_PAYMENTS_CL);

export const setPayments = createAction(CLActions.SET_PAYMENTS_CL, props<{ payload: Payment[] }>());

export const sendPayment = createAction(CLActions.SEND_PAYMENT_CL, props<{ payload: SendPayment }>());

export const sendPaymentStatus = createAction(CLActions.SEND_PAYMENT_STATUS_CL, props<{ payload: any }>());

export const getQueryRoutes = createAction(CLActions.GET_QUERY_ROUTES_CL, props<{ payload: GetQueryRoutes }>());

export const setQueryRoutes = createAction(CLActions.SET_QUERY_ROUTES_CL, props<{ payload: QueryRoutes }>());

export const fetchChannels = createAction(CLActions.FETCH_CHANNELS_CL);

export const setChannels = createAction(CLActions.SET_CHANNELS_CL, props<{ payload: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[] } }>());

export const updateChannel = createAction(CLActions.UPDATE_CHANNEL_CL, props<{ payload: UpdateChannel }>());

export const saveNewChannel = createAction(CLActions.SAVE_NEW_CHANNEL_CL, props<{ payload: SaveChannel }>());

export const closeChannel = createAction(CLActions.CLOSE_CHANNEL_CL, props<{ payload: CloseChannel }>());

export const removeChannel = createAction(CLActions.REMOVE_CHANNEL_CL, props<{ payload: CloseChannel }>());

export const peerLookup = createAction(CLActions.PEER_LOOKUP_CL, props<{ payload: string }>());

export const channelLookup = createAction(CLActions.CHANNEL_LOOKUP_CL, props<{ payload: ChannelLookup }>());

export const invoiceLookup = createAction(CLActions.INVOICE_LOOKUP_CL, props<{ payload: string }>());

export const setLookup = createAction(CLActions.SET_LOOKUP_CL, props<{ payload: any }>());

export const getForwardingHistory = createAction(CLActions.GET_FORWARDING_HISTORY_CL, props<{ payload: { status: string } }>());

export const setForwardingHistory = createAction(CLActions.SET_FORWARDING_HISTORY_CL, props<{ payload: ForwardingEvent[] }>());

export const getFailedForwardingHistory = createAction(CLActions.GET_FAILED_FORWARDING_HISTORY_CL);

export const setFailedForwardingHistory = createAction(CLActions.SET_FAILED_FORWARDING_HISTORY_CL, props<{ payload: ForwardingEvent[] }>());

export const getLocalFailedForwardingHistory = createAction(CLActions.GET_LOCAL_FAILED_FORWARDING_HISTORY_CL);

export const setLocalFailedForwardingHistory = createAction(CLActions.SET_LOCAL_FAILED_FORWARDING_HISTORY_CL, props<{ payload: LocalFailedEvent[] }>());

export const fetchInvoices = createAction(CLActions.FETCH_INVOICES_CL, props<{ payload: { num_max_invoices?: number, index_offset?: number, reversed?: boolean } }>());

export const setInvoices = createAction(CLActions.SET_INVOICES_CL, props<{ payload: ListInvoices }>());

export const saveNewInvoice = createAction(CLActions.SAVE_NEW_INVOICE_CL, props<{ payload: { amount: number, label: string, description: string, expiry: number, private: boolean } }>());

export const addInvoice = createAction(CLActions.ADD_INVOICE_CL, props<{ payload: Invoice }>());

export const updateInvoice = createAction(CLActions.UPDATE_INVOICE_CL, props<{ payload: Invoice }>());

export const deleteExpiredInvoice = createAction(CLActions.DELETE_EXPIRED_INVOICE_CL, props<{ payload?: number }>());

export const setChannelTransaction = createAction(CLActions.SET_CHANNEL_TRANSACTION_CL, props<{ payload: OnChain }>());

export const setChannelTransactionRes = createAction(CLActions.SET_CHANNEL_TRANSACTION_RES_CL, props<{ payload: any }>());

export const fetchUTXOs = createAction(CLActions.FETCH_UTXOS_CL);

export const setUTXOs = createAction(CLActions.SET_UTXOS_CL, props<{ payload: UTXO[] }>());

export const fetchOfferInvoice = createAction(CLActions.FETCH_OFFER_INVOICE_CL, props<{ payload: { offer: string, msatoshi?: number } }>());

export const setOfferInvoice = createAction(CLActions.SET_OFFER_INVOICE_CL, props<{ payload: OfferInvoice }>());

export const fetchOffers = createAction(CLActions.FETCH_OFFERS_CL);

export const setOffers = createAction(CLActions.SET_OFFERS_CL, props<{ payload: Offer[] }>());

export const saveNewOffer = createAction(CLActions.SAVE_NEW_OFFER_CL, props<{ payload: { amount: string, description: string, vendor: string } }>());

export const addOffer = createAction(CLActions.ADD_OFFER_CL, props<{ payload: Offer }>());

export const disableOffer = createAction(CLActions.DISABLE_OFFER_CL, props<{ payload: { offer_id: string } }>());

export const updateOffer = createAction(CLActions.UPDATE_OFFER_CL, props<{ payload: { offer: Offer } }>());

export const fetchOfferBookmarks = createAction(CLActions.FETCH_OFFER_BOOKMARKS_CL);

export const setOfferBookmarks = createAction(CLActions.SET_OFFER_BOOKMARKS_CL, props<{ payload: OfferBookmark[] }>());

export const addUpdateOfferBookmark = createAction(CLActions.ADD_UPDATE_OFFER_BOOKMARK_CL, props<{ payload: OfferBookmark }>());

export const deleteOfferBookmark = createAction(CLActions.DELETE_OFFER_BOOKMARK_CL, props<{ payload: { bolt12: string } }>());

export const removeOfferBookmark = createAction(CLActions.REMOVE_OFFER_BOOKMARK_CL, props<{ payload: { bolt12: string } }>());
