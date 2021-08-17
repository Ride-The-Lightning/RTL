import { SelNodeChild } from '../../shared/models/RTLconfig';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Peer, Payment, Channel, FeeRates, ForwardingHistoryRes, ListInvoices, UTXO } from '../../shared/models/clModels';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';
import * as CLActions from '../store/cl.actions';

export interface CLState {
  apisCallStatus: ApiCallsListCL;
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
  utxos: UTXO[];
}

export const initCLState: CLState = {
  apisCallStatus: {
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchLocalRemoteBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkb: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkw: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchUTXOs: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    GetForwardingHistory: { status: APICallStatusEnum.UN_INITIATED }
  },
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
  utxos: []
};

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
      if (action.payload.forwarding_events && action.payload.forwarding_events.length > 0) {
        const storedChannels = [...state.allChannels];
        action.payload.forwarding_events.forEach((event) => {
          if (storedChannels && storedChannels.length > 0) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id === event.in_channel) {
                event.in_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : event.in_channel;
                if (event.out_channel_alias) {
                  return;
                }
              }
              if (storedChannels[idx].short_channel_id && storedChannels[idx].short_channel_id.toString() === event.out_channel) {
                event.out_channel_alias = storedChannels[idx].alias ? storedChannels[idx].alias : event.out_channel;
                if (event.in_channel_alias) {
                  return;
                }
              }
            }
          }
        });
        modifiedFeeWithTxCount.totalTxCount = action.payload.forwarding_events.filter((event) => event.status === 'settled').length;
      } else {
        action.payload = {};
      }
      return {
        ...state,
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
    case CLActions.SET_UTXOS_CL:
      return {
        ...state,
        utxos: action.payload
      };
    default:
      return state;
  }
}
