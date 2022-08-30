import { createReducer, on } from '@ngrx/store';
import { initCLNState } from './cln.state';
import {
  addInvoice, addPeer, removeChannel, removePeer, resetCLStore, setBalance, setChannels,
  setChildNodeSettingsCL, setFeeRates, setFees, setForwardingHistory,
  setInfo, setInvoices, setLocalRemoteBalance, setOffers, addOffer, setPayments, setPeers, setUTXOs,
  updateCLAPICallStatus, updateInvoice, updateOffer, setOfferBookmarks, addUpdateOfferBookmark, removeOfferBookmark,
  setSwaps, setSwapPeers, setSwapRequests, addSwapout, addSwapin, updateSwapState
} from './cln.actions';
import { Channel, OfferBookmark, Swap } from '../../shared/models/clnModels';
import { CLNForwardingEventsStatusEnum, PeerswapTypes, SwapTypeEnum } from '../../shared/services/consts-enums-functions';

export const CLNReducer = createReducer(initCLNState,
  on(updateCLAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = JSON.parse(JSON.stringify(state.apisCallStatus));
    if (payload.action) {
      updatedApisCallStatus[payload.action] = {
        status: payload.status,
        statusCode: payload.statusCode,
        message: payload.message,
        URL: payload.URL,
        filePath: payload.filePath
      };
    }
    return {
      ...state,
      apisCallStatus: updatedApisCallStatus
    };
  }),
  on(setChildNodeSettingsCL, (state, { payload }) => ({
    ...state,
    nodeSettings: payload
  })),
  on(resetCLStore, (state, { payload }) => ({
    ...initCLNState,
    nodeSettings: payload
  })),
  on(setInfo, (state, { payload }) => ({
    ...state,
    information: payload
  })),
  on(setFees, (state, { payload }) => ({
    ...state,
    fees: payload
  })),
  on(setFeeRates, (state, { payload }) => {
    if (payload.perkb) {
      return {
        ...state,
        feeRatesPerKB: payload
      };
    } else if (payload.perkw) {
      return {
        ...state,
        feeRatesPerKW: payload
      };
    } else {
      return {
        ...state
      };
    }
  }),
  on(setBalance, (state, { payload }) => ({
    ...state,
    balance: payload
  })),
  on(setLocalRemoteBalance, (state, { payload }) => ({
    ...state,
    localRemoteBalance: payload
  })),
  on(setPeers, (state, { payload }) => ({
    ...state,
    peers: payload
  })),
  on(addPeer, (state, { payload }) => ({
    ...state,
    peers: [...state.peers, payload]
  })),
  on(removePeer, (state, { payload }) => {
    const modifiedPeers = [...state.peers];
    const removePeerIdx = state.peers.findIndex((peer) => peer.id === payload.id);
    if (removePeerIdx > -1) {
      modifiedPeers.splice(removePeerIdx, 1);
    }
    return {
      ...state,
      peers: modifiedPeers
    };
  }),
  on(setChannels, (state, { payload }) => ({
    ...state,
    activeChannels: payload.activeChannels,
    pendingChannels: payload.pendingChannels,
    inactiveChannels: payload.inactiveChannels
  })),
  on(removeChannel, (state, { payload }) => {
    const modifiedPeers = [...state.peers];
    modifiedPeers.forEach((peer) => {
      if (peer.id === payload.id) {
        peer.connected = false;
        delete peer.netaddr;
      }
    });
    return {
      ...state,
      peers: modifiedPeers
    };
  }),
  on(setPayments, (state, { payload }) => ({
    ...state,
    payments: payload
  })),
  on(setForwardingHistory, (state, { payload }) => {
    const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
    const forwardsWithAlias = mapAliases(payload.listForwards, storedChannels);
    payload.listForwards = forwardsWithAlias;
    switch (payload.status) {
      case CLNForwardingEventsStatusEnum.SETTLED:
        const modifiedFeeWithTxCount = state.fees;
        modifiedFeeWithTxCount.totalTxCount = payload.totalForwards || 0;
        return {
          ...state,
          fees: modifiedFeeWithTxCount,
          forwardingHistory: payload
        };
      case CLNForwardingEventsStatusEnum.FAILED:
        return {
          ...state,
          failedForwardingHistory: payload
        };
      case CLNForwardingEventsStatusEnum.LOCAL_FAILED:
        return {
          ...state,
          localFailedForwardingHistory: payload
        };
      default:
        return { ...state };
    }
  }),
  on(addInvoice, (state, { payload }) => {
    const newInvoices = state.invoices;
    newInvoices.invoices?.unshift(payload);
    return {
      ...state,
      invoices: newInvoices
    };
  }),
  on(setInvoices, (state, { payload }) => ({
    ...state,
    invoices: payload
  })),
  on(updateInvoice, (state, { payload }) => {
    const modifiedInvoices = state.invoices;
    modifiedInvoices.invoices = modifiedInvoices.invoices?.map((invoice) => ((invoice.label === payload.label) ? payload : invoice));
    return {
      ...state,
      invoices: modifiedInvoices
    };
  }),
  on(setUTXOs, (state, { payload }) => ({
    ...state,
    utxos: payload
  })),
  on(setOffers, (state, { payload }) => ({
    ...state,
    offers: payload
  })),
  on(addOffer, (state, { payload }) => {
    const newOffers = state.offers;
    newOffers?.unshift(payload);
    return {
      ...state,
      offers: newOffers
    };
  }),
  on(updateOffer, (state, { payload }) => {
    const modifiedOffers = [...state.offers];
    const updateOfferIdx = state.offers.findIndex((offer) => offer.offer_id === payload.offer.offer_id);
    if (updateOfferIdx > -1) {
      modifiedOffers.splice(updateOfferIdx, 1, payload.offer);
    }
    return {
      ...state,
      offers: modifiedOffers
    };
  }),
  on(setOfferBookmarks, (state, { payload }) => ({
    ...state,
    offersBookmarks: payload
  })),
  on(addUpdateOfferBookmark, (state, { payload }) => {
    const newOfferBMs: OfferBookmark[] = [...state.offersBookmarks];
    const offerBMExistsIdx = newOfferBMs.findIndex((offer: OfferBookmark) => offer.bolt12 === payload.bolt12);
    if (offerBMExistsIdx < 0) {
      newOfferBMs?.unshift(payload);
    } else {
      const updatedOffer = { ...newOfferBMs[offerBMExistsIdx] };
      updatedOffer.title = payload.title;
      updatedOffer.amountmSat = payload.amountmSat;
      updatedOffer.lastUpdatedAt = payload.lastUpdatedAt;
      updatedOffer.description = payload.description;
      updatedOffer.vendor = payload.vendor;
      newOfferBMs.splice(offerBMExistsIdx, 1, updatedOffer);
    }
    return {
      ...state,
      offersBookmarks: newOfferBMs
    };
  }),
  on(removeOfferBookmark, (state, { payload }) => {
    const modifiedOfferBookmarks = [...state.offersBookmarks];
    const removeOfferBookmarkIdx = state.offersBookmarks.findIndex((ob) => ob.bolt12 === payload.bolt12);
    if (removeOfferBookmarkIdx > -1) {
      modifiedOfferBookmarks.splice(removeOfferBookmarkIdx, 1);
    }
    return {
      ...state,
      offersBookmarks: modifiedOfferBookmarks
    };
  }),
  on(setSwaps, (state, { payload }) => {
    const swapOutArr: Swap[] = [];
    const swapInArr: Swap[] = [];
    const swapCanceledArr: Swap[] = [];
    for (let i = (payload.length - 1); i >= 0; i--) {
      payload[i].alias = state.peers?.find((peer) => peer.id === payload[i].peer_node_id)?.alias || payload[i].peer_node_id;
      if (payload[i].state === 'State_SwapCanceled') {
        swapCanceledArr.push(payload[i]);
      } else {
        if (payload[i].type === PeerswapTypes.SWAP_OUT) {
          swapOutArr.push(payload[i]);
        } else {
          swapInArr.push(payload[i]);
        }
      }
    }
    return {
      ...state,
      swapOuts: swapOutArr,
      swapIns: swapInArr,
      swapsCanceled: swapCanceledArr
    };
  }),
  on(updateSwapState, (state, { payload }) => {
    if (payload.type === SwapTypeEnum.SWAP_IN) {
      const updatedSwapIns = [...state.swapIns];
      const foundSwapIdx = updatedSwapIns.findIndex((swapIn) => (swapIn.id === payload.swapId));
      if (foundSwapIdx > -1) {
        updatedSwapIns[foundSwapIdx].state = payload.state;
      }
      return {
        ...state,
        swapIns: updatedSwapIns
      };
    }
    if (payload.type === SwapTypeEnum.SWAP_OUT) {
      const updatedSwapOuts = [...state.swapOuts];
      const foundSwapIdx = updatedSwapOuts.findIndex((swapOut) => (swapOut.id === payload.swapId));
      if (foundSwapIdx > -1) {
        updatedSwapOuts[foundSwapIdx].state = payload.state;
      }
      return {
        ...state,
        swapOuts: updatedSwapOuts
      };
    }
    return { ...state };
  }),
  on(setSwapRequests, (state, { payload }) => ({
    ...state,
    swapRequests: payload
  })),
  on(setSwapPeers, (state, { payload }) => {
    const flattenedSwapPeers = payload.reduce((acc, swapPeer) => {
      const peerWithFlatChannels: any[] = [];
      swapPeer.alias = state.peers?.find((peer) => peer.id === swapPeer.nodeid)?.alias || swapPeer.nodeid;
      swapPeer.channels?.forEach((channel) => peerWithFlatChannels.push({ ...swapPeer, ...channel }));
      return [...acc, ...peerWithFlatChannels];
    }, <any[]>[]);
    return {
      ...state,
      totalSwapPeers: payload.length || 0,
      swapPeers: flattenedSwapPeers
    };
  }),
  on(addSwapout, (state, { payload }) => {
    const newSwapOuts = state.swapOuts;
    newSwapOuts?.unshift(payload);
    return {
      ...state,
      swapOuts: newSwapOuts
    };
  }),
  on(addSwapin, (state, { payload }) => {
    const newSwapIns = state.swapIns;
    newSwapIns?.unshift(payload);
    return {
      ...state,
      swapIns: newSwapIns
    };
  })
);

const mapAliases = (payload: any, storedChannels: Channel[]) => {
  if (payload && payload.length > 0) {
    payload.forEach((fhEvent, i) => {
      if (storedChannels && storedChannels.length > 0) {
        for (let idx = 0; idx < storedChannels.length; idx++) {
          if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === fhEvent.in_channel) {
            fhEvent.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.in_channel;
            if (fhEvent.out_channel_alias) { return; }
          }
          if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id?.toString() === fhEvent.out_channel) {
            fhEvent.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.out_channel;
            if (fhEvent.in_channel_alias) { return; }
          }
          if (idx === storedChannels.length - 1) {
            if (!fhEvent.in_channel_alias) { fhEvent.in_channel_alias = fhEvent.in_channel ? fhEvent.in_channel : '-'; }
            if (!fhEvent.out_channel_alias) { fhEvent.out_channel_alias = fhEvent.out_channel ? fhEvent.out_channel : '-'; }
          }
        }
      } else {
        fhEvent.in_channel_alias = fhEvent.in_channel ? fhEvent.in_channel : '-';
        fhEvent.out_channel_alias = fhEvent.out_channel ? fhEvent.out_channel : '-';
      }
    });
  } else {
    payload = [];
  }
  return payload;
};
