import { APICallStatusEnum } from '../services/consts-enums-functions';

export interface ApiCallStatusPayload {
  status?: APICallStatusEnum;
  action?: string;
  statusCode?: string;
  message?: string;
  URL?: string;
  filePath?: string;
}

export interface ApiCallsListRoot {
  Login: ApiCallStatusPayload;
  IsAuthorized: ApiCallStatusPayload;
  FetchRTLConfig?: ApiCallStatusPayload;
  UpdateNodeSettings?: ApiCallStatusPayload;
  UpdateApplicationSettings?: ApiCallStatusPayload;
  fetchConfig?: ApiCallStatusPayload;
  VerifyToken?: ApiCallStatusPayload;
  ResetPassword?: ApiCallStatusPayload;
  UpdateSelNode?: ApiCallStatusPayload;
  FetchFile?: ApiCallStatusPayload;
}

export interface ApiCallsListLND {
  FetchInfo: ApiCallStatusPayload;
  FetchFees: ApiCallStatusPayload;
  FetchPendingChannels: ApiCallStatusPayload;
  FetchAllChannels: ApiCallStatusPayload;
  FetchBalanceBlockchain: ApiCallStatusPayload;
  // Non-initial calls
  FetchPageSettings: ApiCallStatusPayload;
  FetchPeers: ApiCallStatusPayload;
  FetchClosedChannels: ApiCallStatusPayload;
  FetchInvoices: ApiCallStatusPayload;
  FetchPayments: ApiCallStatusPayload;
  FetchForwardingHistory: ApiCallStatusPayload;
  FetchUTXOs: ApiCallStatusPayload;
  FetchTransactions: ApiCallStatusPayload;
  FetchNetwork: ApiCallStatusPayload;
  FetchLightningTransactions: ApiCallStatusPayload;
}

export interface ApiCallsListCL {
  FetchInfo: ApiCallStatusPayload;
  FetchChannels: ApiCallStatusPayload;
  FetchUTXOBalances: ApiCallStatusPayload;
  // Non-initial calls
  FetchPageSettings: ApiCallStatusPayload;
  FetchInvoices: ApiCallStatusPayload;
  FetchFeeRatesperkb: ApiCallStatusPayload;
  FetchFeeRatesperkw: ApiCallStatusPayload;
  FetchPeers: ApiCallStatusPayload;
  FetchPayments: ApiCallStatusPayload;
  FetchForwardingHistoryS: ApiCallStatusPayload;
  FetchForwardingHistoryF: ApiCallStatusPayload;
  FetchForwardingHistoryL: ApiCallStatusPayload;
  FetchOffers: ApiCallStatusPayload;
  FetchOfferBookmarks: ApiCallStatusPayload;
}

export interface ApiCallsListECL {
  FetchInfo: ApiCallStatusPayload;
  FetchFees: ApiCallStatusPayload;
  FetchChannels: ApiCallStatusPayload;
  // Non-initial calls
  FetchPageSettings: ApiCallStatusPayload;
  FetchOnchainBalance: ApiCallStatusPayload;
  FetchPeers: ApiCallStatusPayload;
  FetchPayments: ApiCallStatusPayload;
  FetchInvoices: ApiCallStatusPayload;
  FetchTransactions: ApiCallStatusPayload;
}
