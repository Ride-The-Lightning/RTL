import * as LNDActions from './lnd.actions';
import {
  GetInfo, GetInfoChain, Peer, AddressType, Fees, NetworkInfo, Balance, Channel,
  Payment, ListInvoices, PendingChannels, ClosedChannel, Transaction, SwitchRes, QueryRoutes
} from '../../shared/models/lndModels';
import * as fromApp from '../../store/rtl.reducers';

export interface FeatureState extends fromApp.State {
  lnd: LNDState;
}

export interface LNDState {
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
  numberOfPendingChannels: number;
  totalLocalBalance: number;
  totalRemoteBalance: number;
  totalInvoices: number;
  transactions: Transaction[];
  payments: Payment[];
  invoices: ListInvoices;
  forwardingHistory: SwitchRes;
  addressTypes: AddressType[];
}

export const LNDInitialState: LNDState = {
  information: {},
  peers: [],
  fees: {},
  networkInfo: {},
  channelBalance: {balance: '', btc_balance: ''},
  blockchainBalance: { total_balance: '', btc_total_balance: ''},
  allChannels: [],
  closedChannels: [],
  pendingChannels: {},
  numberOfActiveChannels: 0,
  numberOfInactiveChannels: 0,
  numberOfPendingChannels: -1,
  totalLocalBalance: -1,
  totalRemoteBalance: -1,
  totalInvoices: -1,
  transactions: [],
  payments: [],
  invoices: {invoices: []},
  forwardingHistory: {},
  addressTypes: [
    { addressId: '0', addressTp: 'p2wkh', addressDetails: 'Pay to witness key hash'},
    { addressId: '1', addressTp: 'np2wkh', addressDetails: 'Pay to nested witness key hash (default)'}
  ]
};

export function LNDReducer(state = LNDInitialState, action: LNDActions.LNDActions) {
  switch (action.type) {
    case LNDActions.RESET_LND_STORE:
      return {
        ...LNDInitialState
      };
    case LNDActions.SET_INFO:
      if (undefined !== action.payload.chains) {
        if (typeof action.payload.chains[0] === 'string') {
          action.payload.smaller_currency_unit = (action.payload.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? 'Litoshis' : 'Sats';
          action.payload.currency_unit = (action.payload.chains[0].toString().toLowerCase().indexOf('bitcoin') < 0) ? 'LTC' : 'BTC';
        } else if (typeof action.payload.chains[0] === 'object' && action.payload.chains[0].hasOwnProperty('chain')) {
          const getInfoChain = <GetInfoChain>action.payload.chains[0];
          action.payload.smaller_currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? 'Litoshis' : 'Sats';
          action.payload.currency_unit = (getInfoChain.chain.toLowerCase().indexOf('bitcoin') < 0) ? 'LTC' : 'BTC';
        }
        action.payload.version = (undefined === action.payload.version) ? '' : action.payload.version.split(' ')[0];
      } else {
        action.payload.smaller_currency_unit = 'Sats';
        action.payload.currency_unit = 'BTC';
        action.payload.version = (undefined === action.payload.version) ? '' : action.payload.version.split(' ')[0];
      }
      return {
        ...state,
        information: action.payload
      };
    case LNDActions.SET_PEERS:
      return {
        ...state,
        peers: action.payload
      };
    case LNDActions.ADD_PEER:
      return {
        ...state,
        peers: [...state.peers, action.payload]
      };
    case LNDActions.REMOVE_PEER:
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
    case LNDActions.ADD_INVOICE:
      const newInvoices = state.invoices;
      newInvoices.invoices.unshift(action.payload);
      return {
        ...state,
        invoices: newInvoices
      };
    case LNDActions.SET_FEES:
      return {
        ...state,
        fees: action.payload
      };
    case LNDActions.SET_CLOSED_CHANNELS:
      return {
        ...state,
        closedChannels: action.payload,
      };
    case LNDActions.SET_PENDING_CHANNELS:
      let pendingChannels = -1;
      if (action.payload) {
        pendingChannels = 0;
        if (action.payload.pending_closing_channels) {
          pendingChannels = pendingChannels + action.payload.pending_closing_channels.length;
        }
        if (action.payload.pending_force_closing_channels) {
          pendingChannels = pendingChannels + action.payload.pending_force_closing_channels.length;
        }
        if (action.payload.pending_open_channels) {
          pendingChannels = pendingChannels + action.payload.pending_open_channels.length;
        }
        if (action.payload.waiting_close_channels) {
          pendingChannels = pendingChannels + action.payload.waiting_close_channels.length;
        }
      }
      return {
        ...state,
        pendingChannels: action.payload,
        numberOfPendingChannels: pendingChannels,
      };
    case LNDActions.SET_CHANNELS:
      let localBal = 0, remoteBal = 0, activeChannels = 0, inactiveChannels = 0;
      if (action.payload) {
        action.payload.filter(channel => {
          if (undefined !== channel.local_balance) {
            localBal = +localBal + +channel.local_balance;
          }
          if (undefined !== channel.remote_balance) {
            remoteBal = +remoteBal + +channel.remote_balance;
          }
          if (channel.active === true) {
            activeChannels = activeChannels + 1;
          } else {
            inactiveChannels = inactiveChannels + 1;
          }
        });
      }
      return {
        ...state,
        allChannels: action.payload,
        numberOfActiveChannels: activeChannels,
        numberOfInactiveChannels: inactiveChannels,
        totalLocalBalance: localBal,
        totalRemoteBalance: remoteBal
      };
    case LNDActions.REMOVE_CHANNEL:
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
    case LNDActions.SET_BALANCE:
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
    case LNDActions.SET_NETWORK:
      return {
        ...state,
        networkInfo: action.payload
      };
    case LNDActions.SET_INVOICES:
      return {
        ...state,
        invoices: action.payload
      };
    case LNDActions.SET_TOTAL_INVOICES:
      return {
        ...state,
        totalInvoices: action.payload
      };
    case LNDActions.SET_TRANSACTIONS:
      return {
        ...state,
        transactions: action.payload
      };
    case LNDActions.SET_PAYMENTS:
      return {
        ...state,
        payments: action.payload
      };
    case LNDActions.SET_FORWARDING_HISTORY:
      if (action.payload.forwarding_events) {
        const storedChannels = [...state.allChannels];
        action.payload.forwarding_events.forEach(event => {
          if (storedChannels) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].chan_id.toString() === event.chan_id_in) {
                event.alias_in = storedChannels[idx].remote_alias;
                if (event.alias_out) { return; }
              }
              if (storedChannels[idx].chan_id.toString() === event.chan_id_out) {
                event.alias_out = storedChannels[idx].remote_alias;
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
    default:
      return state;
  }

}
