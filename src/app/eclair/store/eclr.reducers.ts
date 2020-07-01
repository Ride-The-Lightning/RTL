import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, ChannelStats, Fees, OnChainBalance, LightningBalance, Peer, ChannelsStatus, Payments } from '../../shared/models/eclrModels';
import { ErrorPayload } from '../../shared/models/errorPayload';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as ECLRActions from './eclr.actions';

export interface ECLRState {
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
}

export const initECLRState: ECLRState = {
  effectErrors: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  information: {},
  fees: {},
  activeChannels: [],
  pendingChannels: [],
  inactiveChannels: [],
  channelsStatus: {},
  channelStats: [],
  onchainBalance: { totalBalance: 0, confBalance: 0, unconfBalance: 0 },
  lightningBalance:  { localBalance: -1, remoteBalance: -1 },
  peers: [],
  payments: {}
}

export function ECLRReducer(state = initECLRState, action: ECLRActions.ECLRActions) {
  switch (action.type) {
    case ECLRActions.CLEAR_EFFECT_ERROR_ECLR:
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
    case ECLRActions.EFFECT_ERROR_ECLR:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case ECLRActions.SET_CHILD_NODE_SETTINGS_ECLR:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case ECLRActions.RESET_ECLR_STORE:
      return {
        ...initECLRState,
        nodeSettings: action.payload,
      };
    case ECLRActions.SET_INFO_ECLR:
      return {
        ...state,
        information: action.payload
      };
    case ECLRActions.SET_FEES_ECLR:
      return {
        ...state,
        fees: action.payload
      };
    case ECLRActions.SET_ACTIVE_CHANNELS_ECLR:
      return {
        ...state,
        activeChannels: action.payload,
      };
    case ECLRActions.SET_PENDING_CHANNELS_ECLR:
      return {
        ...state,
        pendingChannels: action.payload,
      };
    case ECLRActions.SET_INACTIVE_CHANNELS_ECLR:
      return {
        ...state,
        inactiveChannels: action.payload,
      };
    case ECLRActions.SET_CHANNELS_STATUS_ECLR:
      return {
        ...state,
        channelsStatus: action.payload,
      };
    case ECLRActions.SET_CHANNEL_STATS_ECLR:
      return {
        ...state,
        channelStats: action.payload,
      };
    case ECLRActions.SET_ONCHAIN_BALANCE_ECLR:
      return {
        ...state,
        onchainBalance: action.payload
      };
    case ECLRActions.SET_LIGHTNING_BALANCE_ECLR:
      return {
        ...state,
        lightningBalance: action.payload
      };
    case ECLRActions.SET_PEERS_ECLR:
      return {
        ...state,
        peers: action.payload
      };
    case ECLRActions.REMOVE_PEER_ECLR:
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
    case ECLRActions.REMOVE_CHANNEL_ECLR:
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
    case ECLRActions.SET_PAYMENTS_ECLR:
      return {
        ...state,
        payments: action.payload
      };
    default:
      return state;
  }

}
