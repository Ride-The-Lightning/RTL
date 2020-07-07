import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, OnChainBalance, LightningBalance, Peer, ChannelsStatus, Payments, Transaction, Invoice } from '../../shared/models/eclModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as ECLActions from './ecl.actions';

export interface ECLState {
  initialAPIResponseCounter: number;
  effectErrors: ErrorPayload[];
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
  initialAPIResponseCounter: 0,
  effectErrors: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
  fees: {},
  activeChannels: [],
  pendingChannels: [],
  inactiveChannels: [],
  channelsStatus: {},
  channelStats: [],
  onchainBalance: { total: 0, confirmed: 0, unconfirmed: 0 },
  lightningBalance:  { localBalance: -1, remoteBalance: -1 },
  peers: [],
  payments: {},
  transactions: [],
  invoices: []
}

export function ECLReducer(state = initECLState, action: ECLActions.ECLActions) {
  switch (action.type) {
    case ECLActions.CLEAR_EFFECT_ERROR_ECL:
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
    case ECLActions.EFFECT_ERROR_ECL:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case ECLActions.SET_CHILD_NODE_SETTINGS_ECL:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case ECLActions.RESET_ECL_STORE:
      return {
        ...initECLState,
        nodeSettings: action.payload,
      };
    case ECLActions.SET_INFO_ECL:
      return {
        ...state,
        information: action.payload
      };
    case ECLActions.SET_FEES_ECL:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        fees: action.payload
      };
    case ECLActions.SET_ACTIVE_CHANNELS_ECL:
      return {
        ...state,
        activeChannels: action.payload,
      };
    case ECLActions.SET_PENDING_CHANNELS_ECL:
      return {
        ...state,
        pendingChannels: action.payload,
      };
    case ECLActions.SET_INACTIVE_CHANNELS_ECL:
      return {
        ...state,
        inactiveChannels: action.payload,
      };
    case ECLActions.SET_CHANNELS_STATUS_ECL:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        channelsStatus: action.payload,
      };
    case ECLActions.SET_CHANNEL_STATS_ECL:
      return {
        ...state,
        channelStats: action.payload,
      };
    case ECLActions.SET_ONCHAIN_BALANCE_ECL:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
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
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        peers: action.payload
      };
    case ECLActions.REMOVE_PEER_ECL:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex(peer => {
        return peer.nodeId === action.payload.nodeId;
      });
      if (removePeerIdx > -1) {
        modifiedPeers.splice(removePeerIdx, 1);
      }
      return {
        ...state,
        peers: modifiedPeers
      };
    case ECLActions.REMOVE_CHANNEL_ECL:
      const modifiedChannels = [...state.activeChannels];
      const removeChannelIdx = state.activeChannels.findIndex(channel => {
        return channel.channelId === action.payload.channelId;
      });
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        activeChannels: modifiedChannels
      };
    case ECLActions.SET_PAYMENTS_ECL:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
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
    default:
      return state;
  }

}
