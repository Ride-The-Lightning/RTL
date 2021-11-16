import { APICallStatusEnum } from '../services/consts-enums-functions';

export interface ApiCallStatusPayload {
  action: string;
  status: APICallStatusEnum;
  statusCode?: string;
  message?: string;
  URL?: string;
  filePath?: string;
}

export interface ApiCallsListRoot {
  Login: any;
  IsAuthorized: any;
  FetchRTLConfig?: any;
  UpdateSettings?: any;
  UpdateServiceSettings?: any;
  Update2FASettings?: any;
  fetchConfig?: any;
  VerifyToken?: any;
  ResetPassword?: any;
  UpdateSelNode?: any;
  FetchFile?: any;
}

export interface ApiCallsListLND {
  FetchInfo: any;
  FetchFees: any;
  FetchPendingChannels: any;
  FetchAllChannels: any;
  FetchBalanceBlockchain: any;
  // Non-initial calls
  FetchPeers: any;
  FetchClosedChannels: any;
  FetchInvoices: any;
  FetchPayments: any;
  GetForwardingHistory: any;
  FetchUTXOs: any;
  FetchTransactions: any;
  FetchNetwork: any;
  FetchLightningTransactions: any;
}

export interface ApiCallsListCL {
  FetchInfo: any;
  FetchFees: any;
  FetchChannels: any;
  FetchBalance: any;
  FetchLocalRemoteBalance: any;
  // Non-initial calls
  FetchInvoices: any;
  FetchFeeRatesperkb: any;
  FetchFeeRatesperkw: any;
  FetchPeers: any;
  FetchUTXOs: any;
  FetchPayments: any;
  GetForwardingHistory: any;
  GetFailedForwardingHistory: any;
}

export interface ApiCallsListECL {
  FetchInfo: any;
  FetchFees: any;
  FetchChannels: any;
  // Non-initial calls
  FetchOnchainBalance: any;
  FetchPeers: any;
  FetchPayments: any;
  FetchInvoices: any;
  FetchTransactions: any;
}
