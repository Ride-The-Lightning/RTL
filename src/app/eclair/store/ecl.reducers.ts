import { createReducer, on } from '@ngrx/store';

import { initECLState } from './ecl.state';
import { addInvoice, removeChannel, removePeer, resetECLStore, setActiveChannels, setChannelsStatus, setChildNodeSettingsECL, setFees, setInactiveChannels, setInfo, setInvoices, setLightningBalance, setOnchainBalance, setPayments, setPeers, setPendingChannels, setTransactions, updateECLAPICallStatus, updateChannelState, updateInvoice, updateRelayedPayment } from './ecl.actions';
import { Channel, PaymentReceived, PaymentRelayed } from '../../shared/models/eclModels';

export const ECLReducer = createReducer(initECLState,
  on(updateECLAPICallStatus, (state, { payload }) => {
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
    if (payload && payload.sent) {
      const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
      payload.sent?.map((sentPayment) => {
        const peerFound = state.peers.find((peer) => peer.nodeId === sentPayment.recipientNodeId);
        sentPayment.recipientNodeAlias = peerFound ? peerFound.alias : sentPayment.recipientNodeId;
        if (sentPayment.parts) {
          sentPayment.parts?.map((part) => {
            const channelFound = storedChannels.find((channel) => channel.channelId === part.toChannelId);
            part.toChannelAlias = channelFound ? channelFound.alias : part.toChannelId;
            return sentPayment.parts;
          });
        }
        return payload.sent;
      });
    }
    if (payload && payload.relayed) {
      const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
      payload.relayed.forEach((rlEvent) => {
        rlEvent = mapAliases(rlEvent, storedChannels);
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
    newInvoices?.unshift(payload);
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
    modifiedInvoices = modifiedInvoices?.map((invoice) => {
      if (invoice.paymentHash === payload.paymentHash) {
        if (payload.hasOwnProperty('type')) {
          const updatedInvoice = JSON.parse(JSON.stringify(invoice));
          updatedInvoice.amountSettled = ((<PaymentReceived>payload).parts && (<PaymentReceived>payload).parts.length && (<PaymentReceived>payload).parts.length > 0 && (<PaymentReceived>payload).parts[0].amount) ? ((<PaymentReceived>payload).parts[0].amount || 0) / 1000 : 0;
          updatedInvoice.receivedAt = ((<PaymentReceived>payload).parts && (<PaymentReceived>payload).parts.length && (<PaymentReceived>payload).parts.length > 0 && (<PaymentReceived>payload).parts[0].timestamp) ? Math.round(((<PaymentReceived>payload).parts[0].timestamp || 0) / 1000) : 0;
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
    modifiedPendingChannels = modifiedPendingChannels?.map((pendingChannel) => {
      if (pendingChannel.channelId === payload.channelId && pendingChannel.nodeId === payload.remoteNodeId) {
        payload.currentState = payload.currentState?.replace(/_/g, ' ');
        pendingChannel.state = payload.currentState;
      }
      return pendingChannel;
    });
    return {
      ...state,
      pendingChannels: modifiedPendingChannels
    };
  }),
  on(updateRelayedPayment, (state, { payload }) => {
    const modifiedPayments = state.payments;
    const updatedPayload = mapAliases(payload, [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels]);
    updatedPayload.amountIn = Math.round((payload.amountIn || 0) / 1000);
    updatedPayload.amountOut = Math.round((payload.amountOut || 0) / 1000);
    modifiedPayments.relayed?.unshift(updatedPayload);
    const feeSats = (payload.amountIn || 0) - (payload.amountOut || 0);
    const modifiedLightningBalance = { localBalance: (state.lightningBalance.localBalance + feeSats), remoteBalance: (state.lightningBalance.remoteBalance - feeSats) };
    const modifiedChannelStatus = state.channelsStatus;
    if (modifiedChannelStatus.active) {
      modifiedChannelStatus.active.capacity = (state.channelsStatus?.active?.capacity || 0) + feeSats;
    }
    const modifiedFees = {
      daily_fee: ((state.fees.daily_fee || 0) + feeSats), daily_txs: ((state.fees.daily_txs || 0) + 1),
      weekly_fee: ((state.fees.weekly_fee || 0) + feeSats), weekly_txs: ((state.fees.weekly_txs || 0) + 1),
      monthly_fee: ((state.fees.monthly_fee || 0) + feeSats), monthly_txs: ((state.fees.monthly_txs || 0) + 1)
    };
    const modifiedActiveChannels = state.activeChannels;
    let foundFrom = false;
    let foundTo = false;
    for (const channel of modifiedActiveChannels) {
      if (channel.channelId === payload.fromChannelId) {
        foundFrom = true;
        const channelTotal = (channel.toLocal || 0) + (channel.toRemote || 0);
        channel.toLocal = (channel.toLocal || 0) + updatedPayload.amountIn;
        channel.toRemote = (channel.toRemote || 0) - updatedPayload.amountIn;
        channel.balancedness = (channelTotal === 0) ? 1 : +(1 - Math.abs((channel.toLocal - channel.toRemote) / channelTotal)).toFixed(3);
      }
      if (channel.channelId === payload.toChannelId) {
        foundTo = true;
        const channelTotal = (channel.toLocal || 0) + (channel.toRemote || 0);
        channel.toLocal = (channel.toLocal || 0) - updatedPayload.amountOut;
        channel.toRemote = (channel.toRemote || 0) + updatedPayload.amountOut;
        channel.balancedness = (channelTotal === 0) ? 1 : +(1 - Math.abs((channel.toLocal - channel.toRemote) / channelTotal)).toFixed(3);
      }
      if (foundTo && foundFrom) {
        break;
      }
    };
    return {
      ...state,
      payments: modifiedPayments,
      lightningBalance: modifiedLightningBalance,
      channelStatus: modifiedChannelStatus,
      fees: modifiedFees,
      activeChannels: modifiedActiveChannels
    };
  })
);

const mapAliases = (rlEvent: PaymentRelayed, storedChannels: Channel[]) => {
  if (rlEvent.type === 'payment-relayed') {
    if (storedChannels && storedChannels.length > 0) {
      for (let idx = 0; idx < storedChannels.length; idx++) {
        if (storedChannels[idx].channelId?.toString() === rlEvent.fromChannelId) {
          rlEvent.fromChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : rlEvent.fromChannelId;
          rlEvent.fromShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
          if (rlEvent.toChannelAlias) {
            return rlEvent;
          }
        }
        if (storedChannels[idx].channelId?.toString() === rlEvent.toChannelId) {
          rlEvent.toChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : rlEvent.toChannelId;
          rlEvent.toShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
          if (rlEvent.fromChannelAlias) {
            return rlEvent;
          }
        }
        if (idx === storedChannels.length - 1) {
          if (!rlEvent.fromChannelAlias) {
            rlEvent.fromChannelAlias = rlEvent.fromChannelId?.substring(0, 17) + '...';
            rlEvent.fromShortChannelId = '';
          }
          if (!rlEvent.toChannelAlias) {
            rlEvent.toChannelAlias = rlEvent.toChannelId?.substring(0, 17) + '...';
            rlEvent.toShortChannelId = '';
          }
        }
      }
    } else {
      rlEvent.fromChannelAlias = rlEvent.fromChannelId?.substring(0, 17) + '...';
      rlEvent.fromShortChannelId = '';
      rlEvent.toChannelAlias = rlEvent.toChannelId?.substring(0, 17) + '...';
      rlEvent.toShortChannelId = '';
    }
  } else if (rlEvent.type = 'trampoline-payment-relayed') {
    if (storedChannels && storedChannels.length > 0) {
      for (let idx = 0; idx < storedChannels.length; idx++) {
        rlEvent.incoming?.forEach((incomingEvent) => {
          if (storedChannels[idx].channelId?.toString() === incomingEvent.channelId) {
            incomingEvent.channelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : incomingEvent.channelId;
            incomingEvent.shortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
          }
        });
        rlEvent.outgoing?.forEach((outgoingEvent) => {
          if (storedChannels[idx].channelId?.toString() === outgoingEvent.channelId) {
            outgoingEvent.channelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : outgoingEvent.channelId;
            outgoingEvent.shortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
          }
        });
        if (idx === storedChannels.length - 1) {
          if (rlEvent.incoming && rlEvent.incoming.length && rlEvent.incoming.length > 0 && !rlEvent.incoming[0].channelAlias) {
            rlEvent.incoming?.forEach((incomingEvent) => {
              incomingEvent.channelAlias = incomingEvent.channelId?.substring(0, 17) + '...';
              incomingEvent.shortChannelId = '';
            });
          }
          if (rlEvent.outgoing && rlEvent.outgoing.length && rlEvent.outgoing.length > 0 && !rlEvent.outgoing[0].channelAlias) {
            rlEvent.outgoing?.forEach((outgoingEvent) => {
              outgoingEvent.channelAlias = outgoingEvent.channelId?.substring(0, 17) + '...';
              outgoingEvent.shortChannelId = '';
            });
          }
        }
      }
    } else {
      rlEvent.incoming?.forEach((incomingEvent) => {
        incomingEvent.channelAlias = incomingEvent.channelId?.substring(0, 17) + '...';
        incomingEvent.shortChannelId = '';
      });
      rlEvent.outgoing?.forEach((outgoingEvent) => {
        outgoingEvent.channelAlias = outgoingEvent.channelId?.substring(0, 17) + '...';
        outgoingEvent.shortChannelId = '';
      });
    }
    rlEvent.amountIn = rlEvent.incoming?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    rlEvent.fromChannelId = rlEvent.incoming && rlEvent.incoming.length ? rlEvent.incoming[0].channelId : '';
    rlEvent.fromChannelAlias = rlEvent.incoming && rlEvent.incoming.length ? rlEvent.incoming[0].channelAlias : '';
    rlEvent.fromShortChannelId = rlEvent.incoming && rlEvent.incoming.length ? rlEvent.incoming[0].shortChannelId : '';

    rlEvent.amountOut = rlEvent.outgoing?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
    rlEvent.toChannelId = rlEvent.outgoing && rlEvent.outgoing.length ? rlEvent.outgoing[0].channelId : '';
    rlEvent.toChannelAlias = rlEvent.outgoing && rlEvent.outgoing.length ? rlEvent.outgoing[0].channelAlias : '';
    rlEvent.toShortChannelId = rlEvent.outgoing && rlEvent.outgoing.length ? rlEvent.outgoing[0].shortChannelId : '';
  }
  return rlEvent;
};
