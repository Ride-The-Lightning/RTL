import { SelNodeChild } from '../../shared/models/RTLconfig';
import { APICallStatusEnum, CLN_DEFAULT_PAGE_SETTINGS, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Peer, Payment, Channel, FeeRates, ListInvoices, UTXO, Offer, OfferBookmark, ListForwards } from '../../shared/models/clnModels';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';
import { PageSettingsCLN } from '../../shared/models/pageSettings';

export interface CLNState {
  apisCallStatus: ApiCallsListCL;
  nodeSettings: SelNodeChild | null;
  pageSettings: PageSettingsCLN[];
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
    FetchFees: { status: APICallStatusEnum.UN_INITIATED },
    FetchChannels: { status: APICallStatusEnum.UN_INITIATED },
    FetchBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchLocalRemoteBalance: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkb: { status: APICallStatusEnum.UN_INITIATED },
    FetchFeeRatesperkw: { status: APICallStatusEnum.UN_INITIATED },
    FetchPeers: { status: APICallStatusEnum.UN_INITIATED },
    FetchUTXOs: { status: APICallStatusEnum.UN_INITIATED },
    FetchPayments: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryS: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryF: { status: APICallStatusEnum.UN_INITIATED },
    FetchForwardingHistoryL: { status: APICallStatusEnum.UN_INITIATED },
    FetchOffers: { status: APICallStatusEnum.UN_INITIATED },
    FetchOfferBookmarks: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [], enableOffers: false, enablePeerswap: false },
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
