import { SelNodeChild } from '../../shared/models/RTLconfig';
import { ApiCallsListLND } from '../../shared/models/apiCallsPayload';
import { APICallStatusEnum, LND_DEFAULT_PAGE_SETTINGS, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Peer, Fees, NetworkInfo, BlockchainBalance, Channel, ListInvoices, PendingChannels, ClosedChannel, Transaction, SwitchRes, PendingChannelsSummary, UTXO, ListPayments, LightningBalance, ChannelsSummary } from '../../shared/models/lndModels';
import { PageSettings } from '../../shared/models/pageSettings';

export interface LNDState {
  apisCallStatus: ApiCallsListLND;
  nodeSettings: SelNodeChild | null;
  pageSettings: PageSettings[];
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
    FetchPageSettings: { status: APICallStatusEnum.UN_INITIATED },
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchClosedChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchPendingChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchAllChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchBalanceBlockchain: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistory: { status: APICallStatusEnum.UN_INITIATED },
    FetchUTXOs: { status: APICallStatusEnum.UN_INITIATED },
    FetchTransactions: { status: APICallStatusEnum.UN_INITIATED },
    FetchLightningTransactions: { status: APICallStatusEnum.UN_INITIATED },
    FetchNetwork: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, unannouncedChannels: false, fiatConversion: false, channelBackupPath: '', currencyUnits: [], selCurrencyUnit: '', lnImplementation: '', swapServerUrl: '' },
  pageSettings: LND_DEFAULT_PAGE_SETTINGS,
  information: {},
  peers: [],
  fees: {
    channel_fees: [],
    day_fee_sum: 0,
    week_fee_sum: 0,
    month_fee_sum: 0,
    daily_tx_count: 0,
    weekly_tx_count: 0,
    monthly_tx_count: 0,
    forwarding_events_history: {}
  },
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
  allLightningTransactions: {
    listPaymentsAll: {
      payments: [],
      first_index_offset: '',
      last_index_offset: ''
    }, listInvoicesAll: {
      invoices: [],
      total_invoices: 0,
      last_index_offset: '',
      first_index_offset: ''
    }
  },
  forwardingHistory: {
    last_offset_index: 0,
    total_fee_msat: 0,
    forwarding_events: []
  }
};
