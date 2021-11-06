import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Peer, Fees, NetworkInfo, Balance, Channel, ListInvoices, PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsGroup, UTXO, ListPayments } from '../../shared/models/lndModels';

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
