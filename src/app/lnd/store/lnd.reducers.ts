import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';
import {
  GetInfo, Peer, Fees, NetworkInfo, Balance, Channel, ListInvoices,
  PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsGroup, UTXO, ListPayments
} from '../../shared/models/lndModels';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';

import * as LNDActions from './lnd.actions';

let flgTransactionsSet = false;
let flgUTXOsSet = false;

export interface LNDState {
  apisCallStatus: ApiCallsListLND;
  nodeSettings: SelNodeChild;
  information: GetInfo;
  peers: Peer[];
  fees: Fees;
  networkInfo: NetworkInfo;
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
  utxos: UTXO[];
  payments: ListPayments;
  invoices: ListInvoices;
  allLightningTransactions: { paymentsAll: ListPayments, invoicesAll: ListInvoices };
  forwardingHistory: SwitchRes;
}

export const initLNDState: LNDState = {
  apisCallStatus: {
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchClosedChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchPendingChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchAllChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchBalanceBlockchain: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    GetForwardingHistory: { status: APICallStatusEnum.UN_INITIATED },
    FetchUTXOs: { status: APICallStatusEnum.UN_INITIATED },
    FetchTransactions: { status: APICallStatusEnum.UN_INITIATED },
    FetchLightningTransactions: { status: APICallStatusEnum.UN_INITIATED },
    FetchNetwork: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, fiatConversion: false, channelBackupPath: '', currencyUnits: [], selCurrencyUnit: '', lnImplementation: '', swapServerUrl: '' },
  information: {},
  peers: [],
  fees: {},
  networkInfo: {},
  blockchainBalance: { total_balance: -1 },
  allChannels: [],
  closedChannels: [],
  pendingChannels: {},
  numberOfActiveChannels: 0,
  numberOfInactiveChannels: 0,
  numberOfPendingChannels: { open: { num_channels: 0, limbo_balance: 0 }, closing: { num_channels: 0, limbo_balance: 0 }, force_closing: { num_channels: 0, limbo_balance: 0 }, waiting_close: { num_channels: 0, limbo_balance: 0 }, total_channels: 0, total_limbo_balance: 0 },
  totalCapacityActive: 0,
  totalCapacityInactive: 0,
  totalLocalBalance: -1,
  totalRemoteBalance: -1,
  totalInvoices: -1,
  transactions: [],
  utxos: [],
  payments: { payments: [] },
  invoices: { invoices: [] },
  allLightningTransactions: { paymentsAll: null, invoicesAll: null },
  forwardingHistory: {}
};

export function LNDReducer(state = initLNDState, action: LNDActions.LNDActions) {
  switch (action.type) {
    case LNDActions.UPDATE_API_CALL_STATUS_LND:
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
    case LNDActions.SET_CHILD_NODE_SETTINGS_LND:
      return {
        ...state,
        nodeSettings: action.payload
      };
    case LNDActions.RESET_LND_STORE:
      return {
        ...initLNDState,
        nodeSettings: action.payload
      };
    case LNDActions.SET_INFO_LND:
      return {
        ...state,
        information: action.payload
      };
    case LNDActions.SET_PEERS_LND:
      return {
        ...state,
        peers: action.payload
      };
    case LNDActions.REMOVE_PEER_LND:
      const modifiedPeers = [...state.peers];
      const removePeerIdx = state.peers.findIndex((peer) => peer.pub_key === action.payload.pubkey);
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
        fees: action.payload
      };
    case LNDActions.SET_CLOSED_CHANNELS_LND:
      return {
        ...state,
        closedChannels: action.payload
      };
    case LNDActions.SET_PENDING_CHANNELS_LND:
      return {
        ...state,
        pendingChannels: action.payload.channels,
        numberOfPendingChannels: action.payload.pendingChannels
      };
    case LNDActions.SET_ALL_CHANNELS_LND:
      let localBal = 0;
      let remoteBal = 0;
      let activeChannels = 0;
      let inactiveChannels = 0;
      let totalCapacityActive = 0;
      let totalCapacityInactive = 0;
      if (action.payload) {
        action.payload.forEach((channel) => {
          if (!channel.local_balance) {
            channel.local_balance = 0;
          }
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
    case LNDActions.REMOVE_CHANNEL_LND:
      const modifiedChannels = [...state.allChannels];
      const removeChannelIdx = state.allChannels.findIndex((channel) => channel.channel_point === action.payload.channelPoint);
      if (removeChannelIdx > -1) {
        modifiedChannels.splice(removeChannelIdx, 1);
      }
      return {
        ...state,
        allChannels: modifiedChannels
      };
    case LNDActions.SET_BALANCE_LND:
      if (action.payload.target === 'Blockchain') {
        return {
          ...state,
          blockchainBalance: action.payload.balance
        };
      } else {
        return { ...state };
      }
    case LNDActions.SET_NETWORK_LND:
      return {
        ...state,
        networkInfo: action.payload
      };
    case LNDActions.SET_INVOICES_LND:
      return {
        ...state,
        invoices: action.payload
      };
    case LNDActions.SET_TOTAL_INVOICES_LND:
      return {
        ...state,
        totalInvoices: action.payload
      };
    case LNDActions.SET_TRANSACTIONS_LND:
      flgTransactionsSet = true;
      if (action.payload.length && flgUTXOsSet) {
        const modifiedUTXOs = [...state.utxos];
        modifiedUTXOs.forEach((utxo) => {
          const foundTransaction = action.payload.find((transaction) => transaction.tx_hash === utxo.outpoint.txid_str);
          utxo.label = foundTransaction && foundTransaction.label ? foundTransaction.label : '';
        });
        return {
          ...state,
          utxos: modifiedUTXOs,
          transactions: action.payload
        };
      }
      return {
        ...state,
        transactions: action.payload
      };
    case LNDActions.SET_UTXOS_LND:
      flgUTXOsSet = true;
      if (action.payload.length && flgTransactionsSet) {
        const transactions = [...state.transactions];
        action.payload.forEach((utxo) => {
          const foundTransaction = transactions.find((transaction) => transaction.tx_hash === utxo.outpoint.txid_str);
          utxo.label = foundTransaction && foundTransaction.label ? foundTransaction.label : '';
        });
      }
      return {
        ...state,
        utxos: action.payload
      };
    case LNDActions.SET_PAYMENTS_LND:
      return {
        ...state,
        payments: action.payload
      };
    case LNDActions.SET_ALL_LIGHTNING_TRANSATIONS_LND:
      return {
        ...state,
        allLightningTransactions: action.payload
      };
    case LNDActions.SET_FORWARDING_HISTORY_LND:
      if (action.payload.forwarding_events) {
        const storedChannels = [...state.allChannels, ...state.closedChannels];
        action.payload.forwarding_events.forEach((event) => {
          if (storedChannels && storedChannels.length > 0) {
            for (let idx = 0; idx < storedChannels.length; idx++) {
              if (storedChannels[idx].chan_id.toString() === event.chan_id_in) {
                event.alias_in = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_in;
                if (event.alias_out) {
                  return;
                }
              }
              if (storedChannels[idx].chan_id.toString() === event.chan_id_out) {
                event.alias_out = storedChannels[idx].remote_alias ? storedChannels[idx].remote_alias : event.chan_id_out;
                if (event.alias_in) {
                  return;
                }
              }
              if (idx === storedChannels.length - 1) {
                if (!event.alias_in) {
                  event.alias_in = event.chan_id_in;
                }
                if (!event.alias_out) {
                  event.alias_out = event.chan_id_out;
                }
              }
            }
          } else {
            event.alias_in = event.chan_id_in;
            event.alias_out = event.chan_id_out;
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
