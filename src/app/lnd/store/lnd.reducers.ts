import { createReducer, on } from '@ngrx/store';

import { initLNDState } from './lnd.state';
import { addInvoice, removeChannel, removePeer, resetLNDStore, setAllChannels, setAllLightningTransactions, setBalanceBlockchain, setChildNodeSettingsLND, setClosedChannels, setFees, setForwardingHistory, setInfo, setInvoices, setNetwork, setPayments, setPeers, setPendingChannels, setTransactions, setUTXOs, updateLNDAPICallStatus, updateInvoice } from './lnd.actions';

let flgTransactionsSet = false;
let flgUTXOsSet = false;

export const LNDReducer = createReducer(initLNDState,
  on(updateLNDAPICallStatus, (state, { payload }) => {
    const updatedApisCallStatus = { ...state.apisCallStatus };
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
  on(setChildNodeSettingsLND, (state, { payload }) => ({
    ...state,
    nodeSettings: payload
  })),
  on(resetLNDStore, (state, { payload }) => ({
    ...initLNDState,
    nodeSettings: payload
  })),
  on(setInfo, (state, { payload }) => ({
    ...state,
    information: payload
  })),
  on(setPeers, (state, { payload }) => ({
    ...state,
    peers: payload
  })),
  on(removePeer, (state, { payload }) => {
    const modifiedPeers = [...state.peers];
    const removePeerIdx = state.peers.findIndex((peer) => peer.pub_key === payload.pubkey);
    if (removePeerIdx > -1) {
      modifiedPeers.splice(removePeerIdx, 1);
    }
    return {
      ...state,
      peers: modifiedPeers
    };
  }),
  on(addInvoice, (state, { payload }) => {
    const newInvoices = state.listInvoices;
    newInvoices.invoices.unshift(payload);
    return {
      ...state,
      invoices: newInvoices
    };
  }),
  on(updateInvoice, (state, { payload }) => {
    const modifiedInvoices = state.listInvoices;
    modifiedInvoices.invoices = modifiedInvoices.invoices.map((invoice) => ((invoice.r_hash === payload.r_hash) ? payload : invoice));
    return {
      ...state,
      invoices: modifiedInvoices
    };
  }),
  on(setFees, (state, { payload }) => ({
    ...state,
    fees: payload
  })),
  on(setClosedChannels, (state, { payload }) => ({
    ...state,
    closedChannels: payload
  })),
  on(setPendingChannels, (state, { payload }) => ({
    ...state,
    pendingChannels: payload.pendingChannels,
    pendingChannelsSummary: payload.pendingChannelsSummary
  })),
  on(setAllChannels, (state, { payload }) => {
    let localBal = 0;
    let remoteBal = 0;
    let activeChannels = 0;
    let inactiveChannels = 0;
    let totalCapacityActive = 0;
    let totalCapacityInactive = 0;
    if (payload) {
      payload.forEach((channel) => {
        if (!channel.local_balance) {
          channel.local_balance = 0;
        }
        if (channel.active === true) {
          totalCapacityActive = totalCapacityActive + +channel.local_balance;
          activeChannels = activeChannels + 1;
          if (channel.local_balance) {
            localBal = +localBal + +channel.local_balance;
          } else {
            channel.local_balance = 0;
          }
          if (channel.remote_balance) {
            remoteBal = +remoteBal + +channel.remote_balance;
          } else {
            channel.remote_balance = 0;
          }
        } else {
          totalCapacityInactive = totalCapacityInactive + +channel.local_balance;
          inactiveChannels = inactiveChannels + 1;
        }
      });
    }
    return {
      ...state,
      allChannels: payload,
      channelsSummary: { active: { num_channels: activeChannels, capacity: totalCapacityActive }, inactive: { num_channels: inactiveChannels, capacity: totalCapacityInactive } },
      lightningBalance: { local: localBal, remote: remoteBal }
    };
  }),
  on(removeChannel, (state, { payload }) => {
    const modifiedChannels = [...state.channels];
    const removeChannelIdx = state.channels.findIndex((channel) => channel.channel_point === payload.channelPoint);
    if (removeChannelIdx > -1) {
      modifiedChannels.splice(removeChannelIdx, 1);
    }
    return {
      ...state,
      allChannels: modifiedChannels
    };
  }),
  on(setBalanceBlockchain, (state, { payload }) => ({
    ...state,
    blockchainBalance: payload
  })),
  on(setNetwork, (state, { payload }) => ({
    ...state,
    networkInfo: payload
  })),
  on(setInvoices, (state, { payload }) => ({
    ...state,
    invoices: payload
  })),
  on(setTransactions, (state, { payload }) => {
    flgTransactionsSet = true;
    if (payload.length && flgUTXOsSet) {
      const modifiedUTXOs = [...state.utxos];
      modifiedUTXOs.forEach((utxo) => {
        const foundTransaction = payload.find((transaction) => transaction.tx_hash === utxo.outpoint.txid_str);
        return { ...utxo, label: foundTransaction && foundTransaction.label ? foundTransaction.label : '' };
      });
      return {
        ...state,
        utxos: modifiedUTXOs,
        transactions: payload
      };
    }
    return {
      ...state,
      transactions: payload
    };
  }),
  on(setUTXOs, (state, { payload }) => {
    flgUTXOsSet = true;
    if (payload.length && flgTransactionsSet) {
      const transactions = [...state.transactions];
      payload.forEach((utxo) => {
        const foundTransaction = transactions.find((transaction) => transaction.tx_hash === utxo.outpoint.txid_str);
        utxo.label = foundTransaction && foundTransaction.label ? foundTransaction.label : '';
      });
    }
    return {
      ...state,
      utxos: payload
    };
  }),
  on(setPayments, (state, { payload }) => ({
    ...state,
    payments: payload
  })),
  on(setAllLightningTransactions, (state, { payload }) => ({
    ...state,
    allLightningTransactions: payload
  })),
  on(setForwardingHistory, (state, { payload }) => {
    const updatedPayload = !payload.forwarding_events ? {} : { ...payload };
    if (updatedPayload.forwarding_events) {
      const storedChannels = [...state.channels, ...state.closedChannels];
      updatedPayload.forwarding_events.forEach((fhEvent) => {
        if (storedChannels && storedChannels.length > 0) {
          for (let idx = 0; idx < storedChannels.length; idx++) {
            if (storedChannels[idx].chan_id.toString() === fhEvent.chan_id_in) {
              fhEvent.alias_in = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : fhEvent.chan_id_in;
              if (fhEvent.alias_out) {
                return;
              }
            }
            if (storedChannels[idx].chan_id.toString() === fhEvent.chan_id_out) {
              fhEvent.alias_out = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : fhEvent.chan_id_out;
              if (fhEvent.alias_in) {
                return;
              }
            }
            if (idx === storedChannels.length - 1) {
              if (!fhEvent.alias_in) {
                fhEvent.alias_in = fhEvent.chan_id_in;
              }
              if (!fhEvent.alias_out) {
                fhEvent.alias_out = fhEvent.chan_id_out;
              }
            }
          }
        } else {
          fhEvent.alias_in = fhEvent.chan_id_in;
          fhEvent.alias_out = fhEvent.chan_id_out;
        }
      });
    }
    return {
      ...state,
      forwardingHistory: updatedPayload
    };
  })
);
