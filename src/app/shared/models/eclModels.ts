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
  description?: string;
  paymentHash?: string;
  paymentPreimage?: string;
  recipientAmount?: number;
  recipientNodeId?: string;
  recipientNodeAlias?: string;
  firstPartTimestamp?: number;
  firstPartTimestampStr?: string;  
  parts: PaymentSentPart[];
}

export interface PaymentSentPart {
  id?: string;
  amount?: number;
  feesPaid?: number;
  toChannelId?: string;
  toChannelAlias?: string;
  timestamp?: number;
  timestampStr?: string;
}

export interface PaymentReceived {
  type?: string;
  paymentHash?: string;
  firstPartTimestamp?: number;
  firstPartTimestampStr?: string;  
  parts: PaymentReceivedPart[];
}

export interface PaymentReceivedPart {
  amount?: number;
  fromChannelId?: string;
  timestamp?: number;
  timestampStr?: string;
}

export interface PaymentRelayed {
  type?: string;
  amountIn?: number;
  amountOut?: number;
  paymentHash?: string;
  fromChannelId?: string;
  fromShortChannelId?: string;
  fromChannelAlias?: string;
  toChannelId?: string;
  toShortChannelId?: string;
  toChannelAlias?: string;
  timestamp?: number;
  timestampStr?: string;
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
  isFunder?: boolean;
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
  total?: number;
  confirmed?: number;
  unconfirmed?: number;
  btc_total?: number;
  btc_confirmed?: number;
  btc_unconfirmed?: number;
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
  channels?: number;
}

export interface SendPaymentOnChain {
  address?:	string;
  amount?: number;
  blocks?: number;
}

export interface Route {
  nodeId?: string;
  alias?: string;
}

export interface Transaction {
  address?: string;
  amount?: number;
  fees?: number;
  blockHash?: string;
  confirmations?: number;
  txid?: string;
  timestamp?: number;
  timestampStr?: string;
}

export interface Invoice {
  prefix?: string;
  timestamp?: number;
  timestampStr?: string;
  expiresAt?: number;
  expiresAtStr?: string;
  receivedAt?: number;
  receivedAtStr?: string;
  status?: string;
  nodeId?: string;
  serialized?: string;
  description?: string;
  paymentHash?: string;
  expiry?: number;
  amount?: number;
  amountSettled?: number;
  features?: { activated: Feature[], unknown: Feature[] }
}

export interface Feature {
  name?: string;
  support?: string;
}

export interface LookupNode {
  signature?: string;
  features?: { activated?: Feature[], unknown?: any[] };
  timestamp?: number;
  timestampStr?: string;
  nodeId?: string;
  rgbColor?: string;
  alias?: string;
  addresses?: string[];
  unknownFields?: string;
}

export interface RoutingPeers {
  channelId?: string;
  alias?: string;
  events?: number;
  totalAmount?: number;
  totalFee?: number;
}
