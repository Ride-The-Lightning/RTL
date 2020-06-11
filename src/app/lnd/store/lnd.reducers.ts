import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ErrorPayload } from '../../shared/models/errorPayload';
import {
  GetInfo, Peer, Fees, NetworkInfo, Balance, Channel, Payment, ListInvoices,
  PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsGroup, SwapStatus
} from '../../shared/models/lndModels';
import * as RTLActions from '../../store/rtl.actions';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';

export interface LNDState {
  effectErrorsLnd: ErrorPayload[];
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
  boltzSwaps: SwapStatus[];
}

export const initLNDState: LNDState = {
  effectErrorsLnd: [],
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
  loopSwaps: [],
  boltzSwaps: []
}

export function LNDReducer(state = initLNDState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR_LND:
      const clearedEffectErrors = [...state.effectErrorsLnd];
      const removeEffectIdx = state.effectErrorsLnd.findIndex(err => {
        return err.action === action.payload;
      });
      if (removeEffectIdx > -1) {
        clearedEffectErrors.splice(removeEffectIdx, 1);
      }
      return {
        ...state,
        effectErrorsLnd: clearedEffectErrors
      };
    case RTLActions.EFFECT_ERROR_LND:
      return {
        ...state,
        effectErrorsLnd: [...state.effectErrorsLnd, action.payload]
      };
    case RTLActions.SET_CHILD_NODE_SETTINGS:
      return {
        ...state,
        nodeSettings: action.payload
      }
    case RTLActions.RESET_LND_STORE:
      return {
        ...initLNDState,
        nodeSettings: action.payload,
      };
    case RTLActions.SET_INFO:
      return {
        ...state,
        information: action.payload
      };
    case RTLActions.SET_PEERS:
      return {
        ...state,
        peers: action.payload
      };
    case RTLActions.REMOVE_PEER:
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
    case RTLActions.ADD_INVOICE:
      const newInvoices = state.invoices;
      newInvoices.invoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case RTLActions.SET_FEES:
      return {
        ...state,
        fees: action.payload
      };
    case RTLActions.SET_CLOSED_CHANNELS:
      return {
        ...state,
        closedChannels: action.payload,
      };
    case RTLActions.SET_PENDING_CHANNELS:
      return {
        ...state,
        pendingChannels: action.payload.channels,
        numberOfPendingChannels: action.payload.pendingChannels,
      };
    case RTLActions.SET_ALL_CHANNELS:
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
        allChannels: action.payload,
        numberOfActiveChannels: activeChannels,
        numberOfInactiveChannels: inactiveChannels,
        totalCapacityActive: totalCapacityActive,
        totalCapacityInactive: totalCapacityInactive,
        totalLocalBalance: localBal,
        totalRemoteBalance: remoteBal
      };
    case RTLActions.REMOVE_CHANNEL:
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
    case RTLActions.SET_BALANCE:
      if (action.payload.target === 'channels') {
        return {
          ...state,
          channelBalance: action.payload.balance
        };
      } else {
        return {
          ...state,
          blockchainBalance: action.payload.balance
        };
      }
    case RTLActions.SET_NETWORK:
      return {
        ...state,
        networkInfo: action.payload
      };
    case RTLActions.SET_INVOICES:
      return {
        ...state,
        invoices: action.payload
      };
    case RTLActions.SET_TOTAL_INVOICES:
      return {
        ...state,
        totalInvoices: action.payload
      };
    case RTLActions.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload
      };
    case RTLActions.SET_PAYMENTS:
      return {
        ...state,
        payments: action.payload
      };
    case RTLActions.SET_FORWARDING_HISTORY:
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
    case RTLActions.SET_LOOP_SWAPS:
      return {
        ...state,
        loopSwaps: action.payload
      };
    case RTLActions.SET_BOLTZ_SWAPS:
      return {
        ...state,
        boltzSwaps: action.payload
      };
    default:
      return state;
  }

}
