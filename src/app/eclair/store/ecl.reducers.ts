import { createReducer, on } from '@ngrx/store';

import { initECLState } from './ecl.state';
import { addInvoice, removeChannel, removePeer, resetECLStore, setActiveChannels, setChannelsStatus, setChildNodeSettingsECL, setFees, setInactiveChannels, setInfo, setInvoices, setLightningBalance, setOnchainBalance, setPayments, setPeers, setPendingChannels, setTransactions, updateECLAPICallStatus, updateChannelState, updateInvoice } from './ecl.actions';
import { PaymentReceived } from '../../shared/models/eclModels';

export const ECLReducer = createReducer(initECLState,
  on(updateECLAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = JSON.parse(JSON.stringify(state.apisCallStatus));
    updatedApisCallStatus[payload.action] = {
      status: payload.status,
      statusCode: payload.statusCode,
      message: payload.message,
      URL: payload.URL,
      filePath: payload.filePath
    };
    return {
      ...state,
      apisCallStatus: updatedApisCallStatus
    };
  }),
  on(setChildNodeSettingsECL, (state, { payload }) => ({
    ...state,
    nodeSettings: payload
  })),
  on(resetECLStore, (state, { payload }) => ({
    ...initECLState,
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
  on(setActiveChannels, (state, { payload }) => ({
    ...state,
    activeChannels: payload
  })),
  on(setPendingChannels, (state, { payload }) => ({
    ...state,
    pendingChannels: payload
  })),
  on(setInactiveChannels, (state, { payload }) => ({
    ...state,
    inactiveChannels: payload
  })),
  on(setChannelsStatus, (state, { payload }) => ({
    ...state,
    channelsStatus: payload
  })),
  on(setOnchainBalance, (state, { payload }) => ({
    ...state,
    onchainBalance: payload
  })),
  on(setLightningBalance, (state, { payload }) => ({
    ...state,
    lightningBalance: payload
  })),
  on(setPeers, (state, { payload }) => ({
    ...state,
    peers: payload
  })),
  on(removePeer, (state, { payload }) => {
    const modifiedPeers = [...state.peers];
    const removePeerIdx = state.peers.findIndex((peer) => peer.nodeId === payload.nodeId);
    if (removePeerIdx > -1) {
      modifiedPeers.splice(removePeerIdx, 1);
    }
    return {
      ...state,
      peers: modifiedPeers
    };
  }),
  on(removeChannel, (state, { payload }) => {
    const modifiedChannels = [...state.activeChannels];
    const removeChannelIdx = state.activeChannels.findIndex((channel) => channel.channelId === payload.channelId);
    if (removeChannelIdx > -1) {
      modifiedChannels.splice(removeChannelIdx, 1);
    }
    return {
      ...state,
      activeChannels: modifiedChannels
    };
  }),
  on(setPayments, (state, { payload }) => {
    if (payload && payload.relayed) {
      const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
      payload.relayed.forEach((rlEvent) => {
        if (storedChannels && storedChannels.length > 0) {
          for (let idx = 0; idx < storedChannels.length; idx++) {
            if (storedChannels[idx].channelId.toString() === rlEvent.fromChannelId) {
              rlEvent.fromChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : rlEvent.fromChannelId;
              rlEvent.fromShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
              if (rlEvent.toChannelAlias) {
                return;
              }
            }
            if (storedChannels[idx].channelId.toString() === rlEvent.toChannelId) {
              rlEvent.toChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : rlEvent.toChannelId;
              rlEvent.toShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
              if (rlEvent.fromChannelAlias) {
                return;
              }
            }
            if (idx === storedChannels.length - 1) {
              if (!rlEvent.fromChannelAlias) {
                rlEvent.fromChannelAlias = rlEvent.fromChannelId.substring(0, 17) + '...';
                rlEvent.fromShortChannelId = '';
              }
              if (!rlEvent.toChannelAlias) {
                rlEvent.toChannelAlias = rlEvent.toChannelId.substring(0, 17) + '...';
                rlEvent.toShortChannelId = '';
              }
            }
          }
        } else {
          rlEvent.fromChannelAlias = rlEvent.fromChannelId.substring(0, 17) + '...';
          rlEvent.fromShortChannelId = '';
          rlEvent.toChannelAlias = rlEvent.toChannelId.substring(0, 17) + '...';
          rlEvent.toShortChannelId = '';
        }
      });
    }
    return {
      ...state,
      payments: payload
    };
  }),
  on(setTransactions, (state, { payload }) => ({
    ...state,
    transactions: payload
  })),
  on(addInvoice, (state, { payload }) => {
    const newInvoices = state.invoices;
    newInvoices.unshift(payload);
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
    let modifiedInvoices = state.invoices;
    modifiedInvoices = modifiedInvoices.map((invoice) => {
      if (invoice.paymentHash === payload.paymentHash) {
        if (payload.hasOwnProperty('type')) {
          const updatedInvoice = invoice;
          updatedInvoice.amountSettled = ((<PaymentReceived>payload).parts && (<PaymentReceived>payload).parts.length && (<PaymentReceived>payload).parts.length > 0 && (<PaymentReceived>payload).parts[0].amount) ? (<PaymentReceived>payload).parts[0].amount / 1000 : 0;
          updatedInvoice.receivedAt = ((<PaymentReceived>payload).parts && (<PaymentReceived>payload).parts.length && (<PaymentReceived>payload).parts.length > 0 && (<PaymentReceived>payload).parts[0].timestamp) ? Math.round((<PaymentReceived>payload).parts[0].timestamp / 1000) : 0;
          updatedInvoice.status = 'received';
          return updatedInvoice;
        } else {
          return payload;
        }
      }
      return invoice;
    });
    return {
      ...state,
      invoices: modifiedInvoices
    };
  }),
  on(updateChannelState, (state, { payload }) => {
    let modifiedPendingChannels = state.pendingChannels;
    modifiedPendingChannels = modifiedPendingChannels.map((pendingChannel) => {
      if (pendingChannel.channelId === payload.channelId && pendingChannel.nodeId === payload.remoteNodeId) {
        payload.currentState = payload.currentState.replace(/_/g, ' ');
        pendingChannel.state = payload.currentState;
      }
      return pendingChannel;
    });
    return {
      ...state,
      pendingChannels: modifiedPendingChannels
    };
  })
);
