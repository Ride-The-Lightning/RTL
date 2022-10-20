import { SelNodeChild } from '../../shared/models/RTLconfig';
import { GetInfo, Channel, Fees, OnChainBalance, LightningBalance, Peer, ChannelsStatus, Payments, Transaction, Invoice } from '../../shared/models/eclModels';
import { ApiCallsListECL } from '../../shared/models/apiCallsPayload';
import { APICallStatusEnum, ECL_DEFAULT_PAGE_SETTINGS, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { PageSettings } from '../../shared/models/pageSettings';

export interface ECLState {
  apisCallStatus: ApiCallsListECL;
  nodeSettings: SelNodeChild | null;
  pageSettings: PageSettings[];
  information: GetInfo;
  fees: Fees;
  activeChannels: Channel[];
  pendingChannels: Channel[];
  inactiveChannels: Channel[];
  channelsStatus: ChannelsStatus;
  onchainBalance: OnChainBalance;
  lightningBalance: LightningBalance;
  peers: Peer[];
  payments: Payments;
  transactions: Transaction[];
  invoices: Invoice[];
}

export const initECLState: ECLState = {
  apisCallStatus: {
    FetchPageSettings: { status: APICallStatusEnum.UN_INITIATED },
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchOnchainBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchTransactions: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [] },
  pageSettings: ECL_DEFAULT_PAGE_SETTINGS,
  information: {},
  fees: {},
  activeChannels: [],
  pendingChannels: [],
  inactiveChannels: [],
  channelsStatus: {
    active: { channels: 0, capacity: 0 },
    inactive: { channels: 0, capacity: 0 },
    pending: { channels: 0, capacity: 0 },
    closing: { channels: 0, capacity: 0 }
  },
  onchainBalance: { total: 0, confirmed: 0, unconfirmed: 0 },
  lightningBalance: { localBalance: -1, remoteBalance: -1 },
  peers: [],
  payments: {},
  transactions: [],
  invoices: []
};
