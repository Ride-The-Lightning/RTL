import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Peer, Fees, NetworkInfo, BlockchainBalance, Channel, ListInvoices, PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsSummary, UTXO, ListPayments, LightningBalance, ChannelsSummary } from '../../shared/models/lndModels';

export interface LNDState {
  apisCallStatus: ApiCallsListLND;
  nodeSettings: SelNodeChild;
  information: GetInfo;
  peers: Peer[];
  fees: Fees;
  networkInfo: NetworkInfo;
  blockchainBalance: BlockchainBalance;
  lightningBalance: LightningBalance;
  channels: Channel[];
  channelsSummary: ChannelsSummary;
  closedChannels: ClosedChannel[];
  pendingChannels: PendingChannels;
  pendingChannelsSummary: PendingChannelsSummary;
  transactions: Transaction[];
  utxos: UTXO[];
  listPayments: ListPayments;
  listInvoices: ListInvoices;
  allLightningTransactions: { listPaymentsAll: ListPayments, listInvoicesAll: ListInvoices };
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
  lightningBalance: { local: -1, remote: -1 },
  channels: [],
  channelsSummary: { active: { num_channels: 0, capacity: 0 }, inactive: { num_channels: 0, capacity: 0 } },
  closedChannels: [],
  pendingChannels: {},
  pendingChannelsSummary: { open: { num_channels: 0, limbo_balance: 0 }, closing: { num_channels: 0, limbo_balance: 0 }, force_closing: { num_channels: 0, limbo_balance: 0 }, waiting_close: { num_channels: 0, limbo_balance: 0 }, total_channels: 0, total_limbo_balance: 0 },
  transactions: [],
  utxos: [],
  listPayments: { payments: [] },
  listInvoices: { invoices: [] },
  allLightningTransactions: { listPaymentsAll: null, listInvoicesAll: null },
  forwardingHistory: {}
};
