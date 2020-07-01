export interface GetInfo {
  version?: string;
  nodeId?: string;
  alias?: string;
  color?: string;
  features?: string;
  chainHash?: string;
  network?: string;
  blockHeight?: number;
  publicAddresses?: string[];
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}

export interface Audit {
  fees: Fees;
  payments: Payments;
}

export interface Fees {
  daily_fee?: number;
  daily_txs?: number;
  weekly_fee?: number;
  weekly_txs?: number;
  monthly_fee?: number;
  monthly_txs?: number;
}

export interface Payments {
  sent?: PaymentSent[];
  received?: PaymentReceived[];
  relayed?: PaymentRelayed[];
}

export interface PaymentSent {
  type?: string;
  id?: string;
  paymentHash?: string;
  paymentPreimage?: string;
  recipientAmount?: number;
  recipientNodeId?: string;
  parts: PaymentSentPart[];
}

export interface PaymentSentPart {
  id?: string;
  amount?: number;
  feesPaid?: number;
  toChannelId?: string;
  timestamp?: number;
}

export interface PaymentReceived {
  type?: string;
  paymentHash?: string;
  parts: PaymentReceivedPart[];
}

export interface PaymentReceivedPart {
  amount?: number;
  fromChannelId?: string;
  timestamp?: number;
}

export interface PaymentRelayed {
  type?: string;
  amountIn?: number;
  amountOut?: number;
  paymentHash?: string;
  fromChannelId?: string;
  toChannelId?: string;
  timestamp?: number;
}

export interface PayRequest {
  prefix?: string;
  timestamp?: number;
  timestampStr?: string;
  nodeId?: string;
  serialized?: string;
  description?: string;
  paymentHash?: string;
  expiry?: number;
  minFinalCltvExpiry?: number;
  amount?: number;
}

export interface Channel {
  alias?: string;
  nodeId?: string;
  channelId?: string;
  state?: string;
  channelFlags?: number;
  toLocal?: number;
  toRemote?: number;
  shortChannelId?: string;
  buried?: boolean;
  feeBaseMsat?: number;
  feeProportionalMillionths?: number;
  balancedness?: number;
}

export interface ChannelStats {
  channelId?: string;
  avgPaymentAmount?: number;
  paymentCount?: number;
  relayFee?: number;
  networkFee?: number;
}

export interface OnChainBalance {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
  btc_totalBalance?: number;
  btc_confBalance?: number;
  btc_unconfBalance?: number;
}

export interface LightningBalance {
  localBalance: number;
  remoteBalance: number;
  pendingBalance?: number;
  btc_localBalance?: number;
  btc_remoteBalance?: number;
  btc_pendingBalance?: number;
}

export interface ChannelStatus {
  channels?: number;
  capacity?:number;
}

export interface ChannelsStatus {
  active?: ChannelStatus;
  inactive?: ChannelStatus;
  pending?: ChannelStatus;
  closing?: ChannelStatus;
}

export interface Peer {
  nodeId?: string;
  alias?: string;
  state?: string;
  address?: string;
  channels?: string;
}

export interface SendPaymentOnChain {
  address?:	string;
  satoshis?: number;
  feeRate?: string;
  minconf?: number;
}

export interface Route {
  nodeId?: string;
  alias?: string;
}

