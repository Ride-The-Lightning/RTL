import { APICallStatusEnum } from "../services/consts-enums-functions";

export interface ErrorPayload {
  action?: string;
  code?: string;
  message?: string;
  URL?: string;
  filePath?: string;
}

export interface ApiCallsList {
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

export interface ApiCallStatusPayload {
  action: string;
  status: APICallStatusEnum;
  statusCode?: string;
  message?: string;
  URL?: string;
  filePath?: string;
}