import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfoCL, FeesCL, BalanceCL, LocalRemoteBalanceCL, AddressTypeCL, PeerCL, PaymentCL, ChannelCL, FeeRatesCL, ForwardingHistoryResCL, ListInvoicesCL } from '../../shared/models/clModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import * as RTLActions from '../../store/rtl.actions';

export interface CLState {
  effectErrorsCl: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfoCL;
  fees: FeesCL;
  feeRatesPerKB: FeeRatesCL;
  feeRatesPerKW: FeeRatesCL;
  balance: BalanceCL;
  localRemoteBalance: LocalRemoteBalanceCL;
  peers: PeerCL[];
  allChannels: ChannelCL[];
  payments: PaymentCL[];
  forwardingHistory: ForwardingHistoryResCL;
  invoices: ListInvoicesCL;
  totalInvoices: number;
  addressTypes: AddressTypeCL[];
}

export const initCLState: CLState = {
  effectErrorsCl: [],
  nodeSettings: { channelBackupPath: '', satsToBTC: false },
  information: {},
  fees: {},
  feeRatesPerKB: {},
  feeRatesPerKW: {},
  balance: {},
  localRemoteBalance: {},
  peers: [],
  allChannels: [],
  payments: [],
  forwardingHistory: {},
  invoices: { invoices: [] },
  totalInvoices: -1,
  addressTypes: [
    { addressId: '0', addressTp: 'bech32', addressDetails: 'bech32' },
    { addressId: '1', addressTp: 'p2sh-segwit', addressDetails: 'p2sh-segwit (default)' }
  ]
}

export function CLReducer(state = initCLState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR_CL:
      const clearedEffectErrors = [...state.effectErrorsCl];
      const removeEffectIdx = state.effectErrorsCl.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrorsCl: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_CL:
      return {
        ...state,
        effectErrorsCl: [...state.effectErrorsCl, action.payload]
      };
    case RTLActions.RESET_CL_STORE:
      return {
        ...initCLState,
        nodeSettings: action.payload,
      };
    case RTLActions.SET_INFO_CL:
      return {
        ...state,
        information: action.payload
      };
    case RTLActions.SET_FEES_CL:
      return {
        ...state,
        fees: action.payload
      };
    case RTLActions.SET_FEE_RATES_CL:
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
        }
      }
    case RTLActions.SET_BALANCE_CL:
      return {
        ...state,
        balance: action.payload
      };
    case RTLActions.SET_LOCAL_REMOTE_BALANCE_CL:
      return {
        ...state,
        localRemoteBalance: action.payload
      };
    case RTLActions.SET_PEERS_CL:
      return {
        ...state,
        peers: action.payload
      };
    case RTLActions.ADD_PEER_CL:
      return {
        ...state,
        peers: [...state.peers, action.payload]
      };
    case RTLActions.REMOVE_PEER_CL:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex(peer => {
        return peer.id === action.payload.id;
      });
      if (removePeerIdx > -1) {
        modifiedPeers.splice(removePeerIdx, 1);
      }
      return {
        ...state,
        peers: modifiedPeers
      };
    case RTLActions.SET_CHANNELS_CL:
      return {
        ...state,
        allChannels: action.payload,
      };
    case RTLActions.REMOVE_CHANNEL_CL:
      const modifiedChannels = [...state.allChannels];
      const removeChannelIdx = state.allChannels.findIndex(channel => {
        return channel.channel_id === action.payload.channelId;
      });
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        allChannels: modifiedChannels
      };
    case RTLActions.SET_PAYMENTS_CL:
      return {
        ...state,
        payments: action.payload
      };
    case RTLActions.SET_FORWARDING_HISTORY_CL:
      return {
        ...state,
        forwardingHistory: action.payload
      };
    case RTLActions.ADD_INVOICE_CL:
      const newInvoices = state.invoices;
      newInvoices.invoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case RTLActions.SET_INVOICES_CL:
      return {
        ...state,
        invoices: action.payload
      };
    case RTLActions.SET_TOTAL_INVOICES_CL:
      return {
        ...state,
        totalInvoices: action.payload
      };
    default:
      return state;
  }

}
