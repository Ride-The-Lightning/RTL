import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, OnChainBalance, LightningBalance, Peer, ChannelsStatus, Payments, Transaction, Invoice, PaymentReceived } from '../../shared/models/eclModels';
import { ApiCallsListECL } from '../../shared/models/apiCallsPayload';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as ECLActions from './ecl.actions';

export interface ECLState {
  apisCallStatus: ApiCallsListECL;
  nodeSettings: SelNodeChild;
  information: GetInfo;
  fees: Fees;
  activeChannels: Channel[];
  pendingChannels: Channel[];
  inactiveChannels: Channel[];
  channelsStatus: ChannelsStatus;
  channelStats: ChannelStats[];
  onchainBalance: OnChainBalance;
  lightningBalance: LightningBalance;
  peers: Peer[];
  payments: Payments;
  transactions: Transaction[];
  invoices: Invoice[];
}

export const initECLState: ECLState = {
  apisCallStatus: {
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchOnchainBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchTransactions: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
  fees: {},
  activeChannels: [],
  pendingChannels: [],
  inactiveChannels: [],
  channelsStatus: {},
  channelStats: [],
  onchainBalance: { total: 0, confirmed: 0, unconfirmed: 0 },
  lightningBalance: { localBalance: -1, remoteBalance: -1 },
  peers: [],
  payments: {},
  transactions: [],
  invoices: []
};

export function ECLReducer(state = initECLState, action: ECLActions.ECLActions) {
  switch (action.type) {
    case ECLActions.SET_CHILD_NODE_SETTINGS_ECL:
      return {
        ...state,
        apiURL: action.payload
      };
    case ECLActions.UPDATE_API_CALL_STATUS_ECL:
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
    case ECLActions.SET_CHILD_NODE_SETTINGS_ECL:
      return {
        ...state,
        nodeSettings: action.payload
      };
    case ECLActions.RESET_ECL_STORE:
      return {
        ...initECLState,
        nodeSettings: action.payload
      };
    case ECLActions.SET_INFO_ECL:
      return {
        ...state,
        information: action.payload
      };
    case ECLActions.SET_FEES_ECL:
      return {
        ...state,
        fees: action.payload
      };
    case ECLActions.SET_ACTIVE_CHANNELS_ECL:
      return {
        ...state,
        activeChannels: action.payload
      };
    case ECLActions.SET_PENDING_CHANNELS_ECL:
      return {
        ...state,
        pendingChannels: action.payload
      };
    case ECLActions.SET_INACTIVE_CHANNELS_ECL:
      return {
        ...state,
        inactiveChannels: action.payload
      };
    case ECLActions.SET_CHANNELS_STATUS_ECL:
      return {
        ...state,
        channelsStatus: action.payload
      };
    case ECLActions.SET_CHANNEL_STATS_ECL:
      return {
        ...state,
        channelStats: action.payload
      };
    case ECLActions.SET_ONCHAIN_BALANCE_ECL:
      return {
        ...state,
        onchainBalance: action.payload
      };
    case ECLActions.SET_LIGHTNING_BALANCE_ECL:
      return {
        ...state,
        lightningBalance: action.payload
      };
    case ECLActions.SET_PEERS_ECL:
      return {
        ...state,
        peers: action.payload
      };
    case ECLActions.REMOVE_PEER_ECL:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex((peer) => peer.nodeId === action.payload.nodeId);
      if (removePeerIdx > -1) {
        modifiedPeers.splice(removePeerIdx, 1);
      }
      return {
        ...state,
        peers: modifiedPeers
      };
    case ECLActions.REMOVE_CHANNEL_ECL:
      const modifiedChannels = [...state.activeChannels];
      const removeChannelIdx = state.activeChannels.findIndex((channel) => channel.channelId === action.payload.channelId);
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        activeChannels: modifiedChannels
      };
    case ECLActions.SET_PAYMENTS_ECL:
      if (action.payload && action.payload.relayed) {
        const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
        action.payload.relayed.forEach((rlEvent) => {
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
        payments: action.payload
      };
    case ECLActions.SET_TRANSACTIONS_ECL:
      return {
        ...state,
        transactions: action.payload
      };
    case ECLActions.ADD_INVOICE_ECL:
      const newInvoices = state.invoices;
      newInvoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case ECLActions.SET_INVOICES_ECL:
      return {
        ...state,
        invoices: action.payload
      };
    case ECLActions.UPDATE_INVOICE_ECL:
      let modifiedInvoices = state.invoices;
      modifiedInvoices = modifiedInvoices.map((invoice) => {
        if (invoice.paymentHash === action.payload.paymentHash) {
          if ((<PaymentReceived>action.payload).type) {
            const updatedInvoice = invoice;
            updatedInvoice.amountSettled = (<PaymentReceived>action.payload).parts[0].amount / 1000;
            updatedInvoice.receivedAt = Math.round((<PaymentReceived>action.payload).parts[0].timestamp / 1000);
            updatedInvoice.status = 'received';
            return updatedInvoice;
          } else {
            return action.payload;
          }
        }
        return invoice;
      });
      return {
        ...state,
        invoices: modifiedInvoices
      };
    default:
      return state;
  }
}
