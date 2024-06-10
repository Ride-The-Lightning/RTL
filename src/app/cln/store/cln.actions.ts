import { createAction, props } from '@ngrx/store';

import { CLNActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { Node } from '../../shared/models/RTLconfig';
import { GetInfo, Peer, Payment, QueryRoutes, Channel, FeeRates, Invoice, InvoicePaymentNotification, ListInvoices, OnChain, UTXO, SaveChannel,
  GetNewAddress, DetachPeer, UpdateChannel, CloseChannel, SendPayment, GetQueryRoutes, ChannelLookup, OfferInvoice, Offer, OfferBookmark, ListForwards, FetchListForwards } from '../../shared/models/clnModels';
import { PageSettings } from '../../shared/models/pageSettings';

export const updateCLNAPICallStatus = createAction(CLNActions.UPDATE_API_CALL_STATUS_CLN, props<{ payload: ApiCallStatusPayload }>());

export const resetCLNStore = createAction(CLNActions.RESET_CLN_STORE);

export const fetchPageSettings = createAction(CLNActions.FETCH_PAGE_SETTINGS_CLN);

export const setPageSettings = createAction(CLNActions.SET_PAGE_SETTINGS_CLN, props<{ payload: PageSettings[] }>());

export const savePageSettings = createAction(CLNActions.SAVE_PAGE_SETTINGS_CLN, props<{ payload: PageSettings[] }>());

export const fetchInfoCLN = createAction(CLNActions.FETCH_INFO_CLN, props<{ payload: { loadPage: string } }>());

export const setInfo = createAction(CLNActions.SET_INFO_CLN, props<{ payload: GetInfo }>());

export const fetchFeeRates = createAction(CLNActions.FETCH_FEE_RATES_CLN, props<{ payload: string }>());

export const setFeeRates = createAction(CLNActions.SET_FEE_RATES_CLN, props<{ payload: FeeRates }>());

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

export const getForwardingHistory = createAction(CLNActions.GET_FORWARDING_HISTORY_CLN, props<{ payload: FetchListForwards }>());

export const setForwardingHistory = createAction(CLNActions.SET_FORWARDING_HISTORY_CLN, props<{ payload: ListForwards }>());

export const fetchInvoices = createAction(CLNActions.FETCH_INVOICES_CLN);

export const setInvoices = createAction(CLNActions.SET_INVOICES_CLN, props<{ payload: ListInvoices }>());

export const saveNewInvoice = createAction(CLNActions.SAVE_NEW_INVOICE_CLN, props<{ payload: { amount_msat: number | 'any', label: string, description: string, expiry: number, exposeprivatechannels: boolean } }>());

export const addInvoice = createAction(CLNActions.ADD_INVOICE_CLN, props<{ payload: Invoice }>());

export const updateInvoice = createAction(CLNActions.UPDATE_INVOICE_CLN, props<{ payload: InvoicePaymentNotification }>());

export const deleteExpiredInvoice = createAction(CLNActions.DELETE_EXPIRED_INVOICE_CLN, props<{ payload?: number | null }>());

export const setChannelTransaction = createAction(CLNActions.SET_CHANNEL_TRANSACTION_CLN, props<{ payload: OnChain }>());

export const setChannelTransactionRes = createAction(CLNActions.SET_CHANNEL_TRANSACTION_RES_CLN, props<{ payload: any }>());

export const fetchUTXOBalances = createAction(CLNActions.FETCH_UTXO_BALANCES_CLN);

export const setUTXOBalances = createAction(CLNActions.SET_UTXO_BALANCES_CLN, props<{ payload: { utxos: UTXO[], localRemoteBalance: { localBalance: number, remoteBalance: number }, balance: any } }>());

export const fetchOfferInvoice = createAction(CLNActions.FETCH_OFFER_INVOICE_CLN, props<{ payload: { offer: string, amount_msat?: number } }>());

export const setOfferInvoice = createAction(CLNActions.SET_OFFER_INVOICE_CLN, props<{ payload: OfferInvoice }>());

export const fetchOffers = createAction(CLNActions.FETCH_OFFERS_CLN);

export const setOffers = createAction(CLNActions.SET_OFFERS_CLN, props<{ payload: Offer[] }>());

export const saveNewOffer = createAction(CLNActions.SAVE_NEW_OFFER_CLN, props<{ payload: { amount: string, description: string, issuer: string } }>());

export const addOffer = createAction(CLNActions.ADD_OFFER_CLN, props<{ payload: Offer }>());

export const disableOffer = createAction(CLNActions.DISABLE_OFFER_CLN, props<{ payload: { offer_id: string } }>());

export const updateOffer = createAction(CLNActions.UPDATE_OFFER_CLN, props<{ payload: { offer: Offer } }>());

export const fetchOfferBookmarks = createAction(CLNActions.FETCH_OFFER_BOOKMARKS_CLN);

export const setOfferBookmarks = createAction(CLNActions.SET_OFFER_BOOKMARKS_CLN, props<{ payload: OfferBookmark[] }>());

export const addUpdateOfferBookmark = createAction(CLNActions.ADD_UPDATE_OFFER_BOOKMARK_CLN, props<{ payload: OfferBookmark }>());

export const deleteOfferBookmark = createAction(CLNActions.DELETE_OFFER_BOOKMARK_CLN, props<{ payload: { bolt12: string } }>());

export const removeOfferBookmark = createAction(CLNActions.REMOVE_OFFER_BOOKMARK_CLN, props<{ payload: { bolt12: string } }>());
