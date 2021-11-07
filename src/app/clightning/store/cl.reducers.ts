import { createReducer, on } from '@ngrx/store';

import { initCLState } from './cl.state';
import { addInvoice, addPeer, removeChannel, removePeer, resetCLStore, setBalance, setChannels, setChildNodeSettingsCL, setFailedForwardingHistory, setFeeRates, setFees, setForwardingHistory, setInfo, setInvoices, setLocalRemoteBalance, setPayments, setPeers, setUTXOs, updateAPICallStatus, updateInvoice } from './cl.actions';

export const CLReducer = createReducer(initCLState,
  on(updateAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = state.apisCallStatus;
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
  on(setChildNodeSettingsCL, (state, { payload }) => ({
    ...state,
    nodeSettings: payload
  })),
  on(resetCLStore, (state, { payload }) => ({
    ...initCLState,
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
    allChannels: payload
  })),
  on(removeChannel, (state, { payload }) => {
    const modifiedChannels = [...state.allChannels];
    const removeChannelIdx = state.allChannels.findIndex((channel) => channel.channel_id === payload.channelId);
    if (removeChannelIdx > -1) {
      modifiedChannels.splice(removeChannelIdx, 1);
    }
    return {
      ...state,
      allChannels: modifiedChannels
    };
  }),
  on(setPayments, (state, { payload }) => ({
    ...state,
    payments: payload
  })),
  on(setForwardingHistory, (state, { payload }) => {
    const modifiedFeeWithTxCount = state.fees;
    if (payload && payload.length > 0) {
      const storedChannels = [...state.allChannels];
      payload.forEach((fhEvent, i) => {
        if (storedChannels && storedChannels.length > 0) {
          for (let idx = 0; idx < storedChannels.length; idx++) {
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === fhEvent.in_channel) {
              fhEvent.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.in_channel;
              if (fhEvent.out_channel_alias) { return; }
            }
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id.toString() === fhEvent.out_channel) {
              fhEvent.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.out_channel;
              if (fhEvent.in_channel_alias) { return; }
            }
            if (idx === storedChannels.length - 1) {
              if (!fhEvent.in_channel_alias) { fhEvent.in_channel_alias = fhEvent.in_channel; }
              if (!fhEvent.out_channel_alias) { fhEvent.out_channel_alias = fhEvent.out_channel; }
            }
          }
        } else {
          fhEvent.in_channel_alias = fhEvent.in_channel;
          fhEvent.out_channel_alias = fhEvent.out_channel;
        }
      });
      modifiedFeeWithTxCount.totalTxCount = payload.length;
    } else {
      payload = [];
    }
    return {
      ...state,
      fee: modifiedFeeWithTxCount,
      forwardingHistory: payload
    };
  }),
  on(setFailedForwardingHistory, (state, { payload }) => {
    if (payload && payload.length > 0) {
      const storedChannels = [...state.allChannels];
      payload.forEach((fhEvent, i) => {
        if (storedChannels && storedChannels.length > 0) {
          for (let idx = 0; idx < storedChannels.length; idx++) {
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === fhEvent.in_channel) {
              fhEvent.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.in_channel;
              if (fhEvent.out_channel_alias) { return; }
            }
            if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id.toString() === fhEvent.out_channel) {
              fhEvent.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : fhEvent.out_channel;
              if (fhEvent.in_channel_alias) { return; }
            }
            if (idx === storedChannels.length - 1) {
              if (!fhEvent.in_channel_alias) { fhEvent.in_channel_alias = fhEvent.in_channel; }
              if (!fhEvent.out_channel_alias) { fhEvent.out_channel_alias = fhEvent.out_channel; }
            }
          }
        } else {
          fhEvent.in_channel_alias = fhEvent.in_channel;
          fhEvent.out_channel_alias = fhEvent.out_channel;
        }
      });
    } else {
      payload = [];
    }
    return {
      ...state,
      failedForwardingHistory: payload
    };
  }),
  on(addInvoice, (state, { payload }) => {
    const newInvoices = state.invoices;
    newInvoices.invoices.unshift(payload);
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
    modifiedInvoices.invoices = modifiedInvoices.invoices.map((invoice) => ((invoice.label === payload.label) ? payload : invoice));
    return {
      ...state,
      invoices: modifiedInvoices
    };
  }),
  on(setUTXOs, (state, { payload }) => ({
    ...state,
    utxos: payload
  }))
);
