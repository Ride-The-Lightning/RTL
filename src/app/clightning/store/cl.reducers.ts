import { SelNodeChild } from '../../shared/models/RTLconfig';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Peer, Payment, Channel, FeeRates, ForwardingHistoryRes, ListInvoices, UTXO } from '../../shared/models/clModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import * as CLActions from '../store/cl.actions';

export interface CLState {
  initialAPIResponseStatus: String[];
  effectErrors: ErrorPayload[];
  nodeSettings: SelNodeChild;
  information: GetInfo;
  fees: Fees;
  feeRatesPerKB: FeeRates;
  feeRatesPerKW: FeeRates;
  balance: Balance;
  localRemoteBalance: LocalRemoteBalance;
  peers: Peer[];
  allChannels: Channel[];
  payments: Payment[];
  forwardingHistory: ForwardingHistoryRes;
  invoices: ListInvoices;
  totalInvoices: number;
  utxos: UTXO[];
}

export const initCLState: CLState = {
  initialAPIResponseStatus: ['INCOMPLETE'], //[0] for All Data Status
  effectErrors: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
  fees: {},
  feeRatesPerKB: {},
  feeRatesPerKW: {},
  balance: {},
  localRemoteBalance: { localBalance: -1, remoteBalance: -1 },
  peers: [],
  allChannels: [],
  payments: [],
  forwardingHistory: {},
  invoices: { invoices: [] },
  totalInvoices: -1,
  utxos: []
}

export function CLReducer(state = initCLState, action: CLActions.CLActions) {
  let newAPIStatus = state.initialAPIResponseStatus;

  switch (action.type) {
    case CLActions.CLEAR_EFFECT_ERROR_CL:
      const clearedEffectErrors = [...state.effectErrors];
      const removeEffectIdx = state.effectErrors.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrors: clearedEffectErrors
      };
    case CLActions.EFFECT_ERROR_CL:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case CLActions.SET_CHILD_NODE_SETTINGS_CL:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case CLActions.RESET_CL_STORE:
      return {
        ...initCLState,
        nodeSettings: action.payload,
      };
    case CLActions.SET_INFO_CL:
      return {
        ...state,
        information: action.payload
      };
    case CLActions.SET_FEES_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'FEES'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        fees: action.payload
      };
    case CLActions.SET_FEE_RATES_CL:
      if (action.payload.perkb) {
        newAPIStatus = [...state.initialAPIResponseStatus, 'FEERATEKB'];
        return {
          ...state,
          initialAPIResponseStatus: newAPIStatus,
          feeRatesPerKB: action.payload
        };
      } else if (action.payload.perkw) {
        newAPIStatus = [...state.initialAPIResponseStatus, 'FEERATEKW'];
        return {
          ...state,
          initialAPIResponseStatus: newAPIStatus,
          feeRatesPerKW: action.payload
        };
      } else {
        return {
          ...state
        }
      }
    case CLActions.SET_BALANCE_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'BALANCE'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        balance: action.payload
      };
    case CLActions.SET_LOCAL_REMOTE_BALANCE_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'CHANNELBALANCE'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        localRemoteBalance: action.payload
      };
    case CLActions.SET_PEERS_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'PEERS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        peers: action.payload
      };
    case CLActions.ADD_PEER_CL:
      return {
        ...state,
        peers: [...state.peers, action.payload]
      };
    case CLActions.REMOVE_PEER_CL:
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
    case CLActions.SET_CHANNELS_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'CHANNELS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        allChannels: action.payload,
      };
    case CLActions.REMOVE_CHANNEL_CL:
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
    case CLActions.SET_PAYMENTS_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'PAYMENTS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        payments: action.payload
      };
    case CLActions.SET_FORWARDING_HISTORY_CL:
      const modifiedFeeWithTxCount = state.fees;
      if (action.payload.forwarding_events && action.payload.forwarding_events.length > 0) {
        const storedChannels = [...state.allChannels];
        action.payload.forwarding_events.forEach(event => {
          if (storedChannels && storedChannels.length > 0) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === event.in_channel) {
                event.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : event.in_channel;
                if (event.out_channel_alias) { return; }
              }
              if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id.toString() === event.out_channel) {
                event.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : event.out_channel;
                if (event.in_channel_alias) { return; }
              }
            }
          }
        });
        modifiedFeeWithTxCount.totalTxCount = action.payload.forwarding_events.filter(event => event.status === 'settled').length;
      } else {
        action.payload = {};
      }
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        fee: modifiedFeeWithTxCount,
        forwardingHistory: action.payload
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
    case CLActions.SET_TOTAL_INVOICES_CL:
      return {
        ...state,
        totalInvoices: action.payload
      };
    case CLActions.SET_UTXOS_CL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'UTXOS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        utxos: action.payload
      };
    default:
      return state;
  }

}
