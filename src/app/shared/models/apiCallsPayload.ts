import { APICallStatusEnum } from "../services/consts-enums-functions";

export interface ApiCallStatusPayload {
  action: string;
  status: APICallStatusEnum;
  statusCode?: string;
  message?: string;
  URL?: string;
  filePath?: string;
}

export interface ApiCallsListLND {
  FetchInfo: any;
  FetchFees: any;
  FetchPeers: any;
  FetchClosedChannels: any;
  FetchPendingChannels: any;
  FetchAllChannels: any;
  FetchBalancechannels: any;
  FetchBalanceblockchain: any;
  FetchInvoices: any;
  FetchPayments: any;
}

export interface ApiCallsListCL {
  FetchInfo: any;
  FetchInvoices: any;
  FetchFees: any;
  FetchChannels: any;
  FetchBalance: any;
  FetchLocalRemoteBalance: any;
  FetchFeeRatesperkb: any;
  FetchFeeRatesperkw: any;
  FetchPeers: any;
  FetchUTXOs: any;
  FetchPayments: any;
  GetForwardingHistory: any;
}

export interface ApiCallsListECL {
  FetchInfo: any;
  FetchFees: any;
  FetchChannels: any;
  FetchOnchainBalance: any;
  FetchPeers: any;
  FetchPayments: any;
}
