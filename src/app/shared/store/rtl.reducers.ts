import * as RTLActions from './rtl.actions';

import { ErrorPayload } from '../models/errorPayload';
import { RTLConfiguration } from '../models/RTLconfig';
import {
  GetInfo, GetInfoChain, Peer, AddressType, Fees, NetworkInfo, Balance, Channel, Payment, Invoice, PendingChannels, ClosedChannel, Transaction, SwitchRes
} from '../models/lndModels';

export interface State {
  effectErrors: ErrorPayload[];
  appConfig: RTLConfiguration;
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
  transactions: Transaction[];
  payments: Payment[];
  invoices: Invoice[];
  forwardingHistory: SwitchRes;
  addressTypes: AddressType[];
}

const initialState: State = {
  effectErrors: [],
  appConfig: {
    sso: { rtlSSO: 0, logoutRedirectLink: '/login' },
    nodes: [{
      settings: { flgSidenavOpened: true, flgSidenavPinned: true, menu: 'Vertical', menuType: 'Regular', theme: 'dark-blue', satsToBTC: false },
      authentication: { nodeAuthType: 'CUSTOM', lndConfigPath: '', bitcoindConfigPath: '' }
    }]
  },
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
  transactions: [],
  payments: [],
  invoices: [],
  forwardingHistory: {},
  addressTypes: [
    { addressId: '0', addressTp: 'p2wkh', addressDetails: 'Pay to witness key hash'},
    { addressId: '1', addressTp: 'np2wkh', addressDetails: 'Pay to nested witness key hash (default)'}
  ]
};

export function RTLRootReducer(state = initialState, action: RTLActions.RTLActions) {
  switch (action.type) {
    case RTLActions.CLEAR_EFFECT_ERROR:
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
    case RTLActions.EFFECT_ERROR:
      return {
        ...state,
        effectErrors: [...state.effectErrors, action.payload]
      };
    case RTLActions.SET_RTL_CONFIG:
      return {
        ...state,
        appConfig: action.payload
      };
    case RTLActions.SET_INFO:
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
    case RTLActions.SET_PEERS:
      return {
        ...state,
        peers: action.payload
      };
    case RTLActions.ADD_PEER:
      return {
        ...state,
        peers: [...state.peers, action.payload]
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
      return {
        ...state,
        invoices: [action.payload, ...state.invoices]
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
    case RTLActions.SET_CHANNELS:
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
