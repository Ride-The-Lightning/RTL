import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ErrorPayload } from '../../shared/models/errorPayload';
import {
  GetInfo, Peer, Fees, NetworkInfo, Balance, Channel, Payment, ListInvoices,
  PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsGroup, SwapStatus
} from '../../shared/models/lndModels';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import * as LNDActions from './lnd.actions';

export interface LNDState {
  initialAPIResponseCounter: number;
  effectErrors: ErrorPayload[];
  nodeSettings: SelNodeChild;  
  information: GetInfo;
  peers: Peer[];
  fees: Fees;
  networkInfo: NetworkInfo;
  channelBalance: Balance;
  blockchainBalance: Balance;
  allChannels: Channel[];
  closedChannels: ClosedChannel[];
  pendingChannels: PendingChannels;
  numberOfActiveChannels: number;
  numberOfInactiveChannels: number;
  numberOfPendingChannels: PendingChannelsGroup;
  totalCapacityActive: number;
  totalCapacityInactive: number;
  totalLocalBalance: number;
  totalRemoteBalance: number;
  totalInvoices: number;
  transactions: Transaction[];
  payments: Payment[];
  invoices: ListInvoices;
  forwardingHistory: SwitchRes;
  loopSwaps: SwapStatus[];
}

export const initLNDState: LNDState = {
  initialAPIResponseCounter: 0,
  effectErrors: [],
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, fiatConversion: false, channelBackupPath: '', currencyUnits: [], selCurrencyUnit: '', lnImplementation: '', swapServerUrl: '' },
  information: {},
  peers: [],
  fees: {},
  networkInfo: {},
  channelBalance: { balance: -1, btc_balance: -1 },
  blockchainBalance: { total_balance: -1, btc_total_balance: -1 },
  allChannels: [],
  closedChannels: [],
  pendingChannels: {},
  numberOfActiveChannels: 0,
  numberOfInactiveChannels: 0,
  numberOfPendingChannels: { open: {num_channels: 0, limbo_balance: 0}, closing: {num_channels: 0, limbo_balance: 0}, force_closing: {num_channels: 0, limbo_balance: 0}, waiting_close: {num_channels: 0, limbo_balance: 0}, total_channels: 0, total_limbo_balance: 0},
  totalCapacityActive: 0,
  totalCapacityInactive: 0,
  totalLocalBalance: -1,
  totalRemoteBalance: -1,
  totalInvoices: -1,
  transactions: [],
  payments: [],
  invoices: {invoices: []},
  forwardingHistory: {},
  loopSwaps: []
}

export function LNDReducer(state = initLNDState, action: LNDActions.LNDActions) {
  switch (action.type) {
    case LNDActions.CLEAR_EFFECT_ERROR_LND:
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
    case LNDActions.EFFECT_ERROR_LND:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case LNDActions.SET_CHILD_NODE_SETTINGS_LND:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case LNDActions.RESET_LND_STORE:
      return {
        ...initLNDState,
        nodeSettings: action.payload,
      };
    case LNDActions.SET_INFO_LND:
      return {
        ...state,
        information: action.payload
      };
    case LNDActions.SET_PEERS_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        peers: action.payload
      };
    case LNDActions.REMOVE_PEER_LND:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex(peer => {
        return peer.pub_key === action.payload.pubkey;
      });
      if (removePeerIdx > -1) {
        modifiedPeers.splice(removePeerIdx, 1);
      }
      return {
        ...state,
        peers: modifiedPeers
      };
    case LNDActions.ADD_INVOICE_LND:
      const newInvoices = state.invoices;
      newInvoices.invoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case LNDActions.SET_FEES_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        fees: action.payload
      };
    case LNDActions.SET_CLOSED_CHANNELS_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        closedChannels: action.payload,
      };
    case LNDActions.SET_PENDING_CHANNELS_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        pendingChannels: action.payload.channels,
        numberOfPendingChannels: action.payload.pendingChannels,
      };
    case LNDActions.SET_ALL_CHANNELS_LND:
      let localBal = 0, remoteBal = 0, activeChannels = 0, inactiveChannels = 0, totalCapacityActive = 0, totalCapacityInactive = 0;
      if (action.payload) {
        action.payload.forEach(channel => {
          if(!channel.local_balance) { channel.local_balance = 0; }
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
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        allChannels: action.payload,
        numberOfActiveChannels: activeChannels,
        numberOfInactiveChannels: inactiveChannels,
        totalCapacityActive: totalCapacityActive,
        totalCapacityInactive: totalCapacityInactive,
        totalLocalBalance: localBal,
        totalRemoteBalance: remoteBal
      };
    case LNDActions.REMOVE_CHANNEL_LND:
      const modifiedChannels = [...state.allChannels];
      const removeChannelIdx = state.allChannels.findIndex(channel => {
        return channel.channel_point === action.payload.channelPoint;
      });
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        allChannels: modifiedChannels
      };
    case LNDActions.SET_BALANCE_LND:
      if (action.payload.target === 'channels') {
        return {
          ...state,
          initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
          channelBalance: action.payload.balance
        };
      } else {
        return {
          ...state,
          blockchainBalance: action.payload.balance
        };
      }
    case LNDActions.SET_NETWORK_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        networkInfo: action.payload
      };
    case LNDActions.SET_INVOICES_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        invoices: action.payload
      };
    case LNDActions.SET_TOTAL_INVOICES_LND:
      return {
        ...state,
        totalInvoices: action.payload
      };
    case LNDActions.SET_TRANSACTIONS_LND:
      return {
        ...state,
        transactions: action.payload
      };
    case LNDActions.SET_PAYMENTS_LND:
      return {
        ...state,
        initialAPIResponseCounter: state.initialAPIResponseCounter + 1,
        payments: action.payload
      };
    case LNDActions.SET_FORWARDING_HISTORY_LND:
      if (action.payload.forwarding_events) {
        const storedChannels = [...state.allChannels, ...state.closedChannels];
        action.payload.forwarding_events.forEach(event => {
          if (storedChannels) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].chan_id.toString() === event.chan_id_in) {
                event.alias_in = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_in;
                if (event.alias_out) { return; }
              }
              if (storedChannels[idx].chan_id.toString() === event.chan_id_out) {
                event.alias_out = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_out;
                if (event.alias_in) { return; }
              }
            }
          }
        });
      } else {
        action.payload = {};
      }
      return {
        ...state,
        forwardingHistory: action.payload
      };
    case LNDActions.SET_LOOP_SWAPS_LND:
      return {
        ...state,
        loopSwaps: action.payload
      };
    default:
      return state;
  }

}
