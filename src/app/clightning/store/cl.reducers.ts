import { initCLState } from './cl.state';
import * as CLActions from '../store/cl.actions';

export function CLReducer(state = initCLState, action: CLActions.CLActions) {
  switch (action.type) {
    case CLActions.UPDATE_API_CALL_STATUS_CL:
      const updatedApisCallStatus = state.apisCallStatus;
      updatedApisCallStatus[action.payload.action] = {
        status: action.payload.status,
        statusCode: action.payload.statusCode,
        message: action.payload.message,
        URL: action.payload.URL,
        filePath: action.payload.filePath
      };
      return {
        ...state,
        apisCallStatus: updatedApisCallStatus
      };
    case CLActions.SET_CHILD_NODE_SETTINGS_CL:
      return {
        ...state,
        nodeSettings: action.payload
      };
    case CLActions.RESET_CL_STORE:
      return {
        ...initCLState,
        nodeSettings: action.payload
      };
    case CLActions.SET_INFO_CL:
      return {
        ...state,
        information: action.payload
      };
    case CLActions.SET_FEES_CL:
      return {
        ...state,
        fees: action.payload
      };
    case CLActions.SET_FEE_RATES_CL:
      if (action.payload.perkb) {
        return {
          ...state,
          feeRatesPerKB: action.payload
        };
      } else if (action.payload.perkw) {
        return {
          ...state,
          feeRatesPerKW: action.payload
        };
      } else {
        return {
          ...state
        };
      }
    case CLActions.SET_BALANCE_CL:
      return {
        ...state,
        balance: action.payload
      };
    case CLActions.SET_LOCAL_REMOTE_BALANCE_CL:
      return {
        ...state,
        localRemoteBalance: action.payload
      };
    case CLActions.SET_PEERS_CL:
      return {
        ...state,
        peers: action.payload
      };
    case CLActions.ADD_PEER_CL:
      return {
        ...state,
        peers: [...state.peers, action.payload]
      };
    case CLActions.REMOVE_PEER_CL:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex((peer) => peer.id === action.payload.id);
      if (removePeerIdx > -1) {
        modifiedPeers.splice(removePeerIdx, 1);
      }
      return {
        ...state,
        peers: modifiedPeers
      };
    case CLActions.SET_CHANNELS_CL:
      return {
        ...state,
        allChannels: action.payload
      };
    case CLActions.REMOVE_CHANNEL_CL:
      const modifiedChannels = [...state.allChannels];
      const removeChannelIdx = state.allChannels.findIndex((channel) => channel.channel_id === action.payload.channelId);
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        allChannels: modifiedChannels
      };
    case CLActions.SET_PAYMENTS_CL:
      return {
        ...state,
        payments: action.payload
      };
    case CLActions.SET_FORWARDING_HISTORY_CL:
      const modifiedFeeWithTxCount = state.fees;
      if (action.payload && action.payload.length > 0) {
        const storedChannels = [...state.allChannels];
        action.payload.forEach((fhEvent, i) => {
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
        modifiedFeeWithTxCount.totalTxCount = action.payload.length;
      } else {
        action.payload = [];
      }
      return {
        ...state,
        fee: modifiedFeeWithTxCount,
        forwardingHistory: action.payload
      };
    case CLActions.SET_FAILED_FORWARDING_HISTORY_CL:
      if (action.payload && action.payload.length > 0) {
        const storedChannels = [...state.allChannels];
        action.payload.forEach((fhEvent, i) => {
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
        action.payload = [];
      }
      return {
        ...state,
        failedForwardingHistory: action.payload
      };
    case CLActions.ADD_INVOICE_CL:
      const newInvoices = state.invoices;
      newInvoices.invoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case CLActions.SET_INVOICES_CL:
      return {
        ...state,
        invoices: action.payload
      };
    case CLActions.UPDATE_INVOICE_CL:
      const modifiedInvoices = state.invoices;
      modifiedInvoices.invoices = modifiedInvoices.invoices.map((invoice) => ((invoice.label === action.payload.label) ? action.payload : invoice));
      return {
        ...state,
        invoices: modifiedInvoices
      };
    case CLActions.SET_UTXOS_CL:
      return {
        ...state,
        utxos: action.payload
      };
    default:
      return state;
  }
}
