import { SelNodeChild } from '../../shared/models/RTLconfig';
import { APICallStatusEnum, UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Fees, Balance, LocalRemoteBalance, Peer, Payment, Channel, FeeRates, ForwardingEvent, ListInvoices, UTXO, Offer, PaidOffer } from '../../shared/models/clModels';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';

export interface CLState {
  apisCallStatus: ApiCallsListCL;
  nodeSettings: SelNodeChild;
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
  forwardingHistory: ForwardingEvent[];
  failedForwardingHistory: ForwardingEvent[];
  invoices: ListInvoices;
  utxos: UTXO[];
  offers: Offer[];
  paidOffers: PaidOffer[];
}

export const initCLState: CLState = {
  apisCallStatus: {
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
    FetchForwardingHistory: { status: APICallStatusEnum.UN_INITIATED },
    FetchFailedForwardingHistory: { status: APICallStatusEnum.UN_INITIATED },
    FetchOffers: { status: APICallStatusEnum.UN_INITIATED },
    FetchPaidOffers: { status: APICallStatusEnum.UN_INITIATED }
  },
  nodeSettings: { userPersona: UserPersonaEnum.OPERATOR, selCurrencyUnit: 'USD', fiatConversion: false, channelBackupPath: '', currencyUnits: [], enableOffers: false },
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
  forwardingHistory: [],
  failedForwardingHistory: [],
  invoices: { invoices: [] },
  utxos: [],
  offers: [],
  paidOffers: []
};
