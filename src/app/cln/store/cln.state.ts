import { APICallStatusEnum, CLN_DEFAULT_PAGE_SETTINGS, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Peer, Payment, Channel, FeeRates, ListInvoices, UTXO, Offer, OfferBookmark, ListForwards } from '../../shared/models/clnModels';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';
import { PageSettings } from '../../shared/models/pageSettings';
import { Authentication, Node, Settings } from '../../shared/models/RTLconfig';

const initNodeSettings: Settings = { userPersona: UserPersonaEnum.OPERATOR, themeMode: 'DAY', themeColor: 'PURPLE',
  channelBackupPath: '', selCurrencyUnit: 'USD', unannouncedChannels: false, fiatConversion: false,
  currencyUnits: ['Sats', 'BTC', 'USD'], bitcoindConfigPath: '', enableOffers: false, enablePeerswap: false,
  logLevel: 'ERROR', lnServerUrl: '', swapServerUrl: '', boltzServerUrl: '', currencyUnit: 'USD' };
const initNodeAuthentication: Authentication = { configPath: '', swapMacaroonPath: '', boltzMacaroonPath: '' };

export interface CLNState {
  apisCallStatus: ApiCallsListCL;
  nodeSettings: Node | null;
  pageSettings: PageSettings[];
  information: GetInfo;
  fees: Fees;
  feeRatesPerKB: FeeRates;
  feeRatesPerKW: FeeRates;
  balance: Balance;
  localRemoteBalance: LocalRemoteBalance;
  peers: Peer[];
  activeChannels: Channel[];
  pendingChannels: Channel[];
  inactiveChannels: Channel[];
  payments: Payment[];
  forwardingHistory: ListForwards;
  failedForwardingHistory: ListForwards;
  localFailedForwardingHistory: ListForwards;
  invoices: ListInvoices;
  utxos: UTXO[];
  offers: Offer[];
  offersBookmarks: OfferBookmark[];
}

export const initCLNState: CLNState = {
  apisCallStatus: {
    FetchPageSettings: { status: APICallStatusEnum.UN_INITIATED },
    FetchInfo: { status: APICallStatusEnum.UN_INITIATED },
    FetchInvoices: { status: APICallStatusEnum.UN_INITIATED },
    FetchChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchUTXOBalances: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkb: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkw: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryS: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryF: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryL: { status: APICallStatusEnum.UN_INITIATED },
    FetchOffers: { status: APICallStatusEnum.UN_INITIATED },
    FetchOfferBookmarks: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { index: 1, lnNode: 'Node 1', settings: initNodeSettings, authentication: initNodeAuthentication, lnImplementation: 'CLN' },
  pageSettings: CLN_DEFAULT_PAGE_SETTINGS,
  information: {},
  fees: {},
  feeRatesPerKB: {},
  feeRatesPerKW: {},
  balance: {},
  localRemoteBalance: { localBalance: -1, remoteBalance: -1 },
  peers: [],
  activeChannels: [],
  pendingChannels: [],
  inactiveChannels: [],
  payments: [],
  forwardingHistory: {},
  failedForwardingHistory: {},
  localFailedForwardingHistory: {},
  invoices: { invoices: [] },
  utxos: [],
  offers: [],
  offersBookmarks: []
};
