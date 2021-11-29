import { createReducer, on } from '@ngrx/store';
import { initCLState } from './cl.state';
import { addInvoice, addPeer, removeChannel, removePeer, resetCLStore, setBalance, setChannels, setChildNodeSettingsCL, setFailedForwardingHistory, setFeeRates, setFees, setForwardingHistory, setInfo, setInvoices, setLocalRemoteBalance, setPayments, setPeers, setUTXOs, updateCLAPICallStatus, updateInvoice } from './cl.actions';
import { Channel } from '../../shared/models/clModels';

export const CLReducer = createReducer(initCLState,
  on(updateCLAPICallStatus, (state, { payload }) => {
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
    const modifiedFeeWithTxCount = state.fees;
    const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
    payload = mapAliases(payload, storedChannels);
    modifiedFeeWithTxCount.totalTxCount = payload.length;
    return {
      ...state,
      fee: modifiedFeeWithTxCount,
      forwardingHistory: payload
    };
  }),
  on(setFailedForwardingHistory, (state, { payload }) => {
    const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
    payload = mapAliases(payload, storedChannels);
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

const mapAliases = (payload: any, storedChannels: Channel[]) => {
  if (payload && payload.length > 0) {
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
  return payload;
};
