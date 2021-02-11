import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, OnChainBalance, LightningBalance, Peer, ChannelsStatus, Payments, Transaction, Invoice } from '../../shared/models/eclModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as ECLActions from './ecl.actions';

export interface ECLState {
  initialAPIResponseStatus: String[];
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
  initialAPIResponseStatus: ['INCOMPLETE'], //[0] for All Data Status
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
  let newAPIStatus = state.initialAPIResponseStatus;

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
      newAPIStatus = [...state.initialAPIResponseStatus, 'FEES'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
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
      newAPIStatus = [...state.initialAPIResponseStatus, 'CHANNELS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        channelsStatus: action.payload,
      };
    case ECLActions.SET_CHANNEL_STATS_ECL:
      return {
        ...state,
        channelStats: action.payload,
      };
    case ECLActions.SET_ONCHAIN_BALANCE_ECL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'ONCHAINBALANCE'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
        onchainBalance: action.payload
      };
    case ECLActions.SET_LIGHTNING_BALANCE_ECL:
      return {
        ...state,
        lightningBalance: action.payload
      };
    case ECLActions.SET_PEERS_ECL:
      newAPIStatus = [...state.initialAPIResponseStatus, 'PEERS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
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
      if (action.payload && action.payload.relayed) {
        const storedChannels = [...state.activeChannels, ...state.pendingChannels, ...state.inactiveChannels];
        action.payload.relayed.forEach(event => {
          if (storedChannels && storedChannels.length > 0) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].channelId.toString() === event.fromChannelId) {
                event.fromChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : event.fromChannelId;
                event.fromShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
                if (event.toChannelAlias) { return; }
              }
              if (storedChannels[idx].channelId.toString() === event.toChannelId) {
                event.toChannelAlias = storedChannels[idx].alias ? storedChannels[idx].alias : event.toChannelId;
                event.toShortChannelId = storedChannels[idx].shortChannelId ? storedChannels[idx].shortChannelId : '';
                if (event.fromChannelAlias) { return; }
              }
              if (idx === storedChannels.length-1) {
                if (!event.fromChannelAlias) {
                  event.fromChannelAlias = event.fromChannelId.substring(0, 17) + '...';
                  event.fromShortChannelId = '';
                }
                if (!event.toChannelAlias) {
                  event.toChannelAlias = event.toChannelId.substring(0, 17) + '...';
                  event.toShortChannelId = '';
                }
              }
            }
          } else {
            event.fromChannelAlias = event.fromChannelId.substring(0, 17) + '...';
            event.fromShortChannelId = '';
            event.toChannelAlias = event.toChannelId.substring(0, 17) + '...';
            event.toShortChannelId = '';
          }
        });
      }
      newAPIStatus = [...state.initialAPIResponseStatus, 'PAYMENTS'];
      return {
        ...state,
        initialAPIResponseStatus: newAPIStatus,
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
