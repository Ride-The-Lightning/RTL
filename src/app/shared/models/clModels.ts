export enum feeRateStyle {
  KB = 'KB',
  KW = 'KW'
}

export interface ChannelStatusCL {
  channels?: number;
  capacity?:number;
}

export interface ChannelsStatusCL {
  active?: ChannelStatusCL;
  inactive?: ChannelStatusCL;
  pending?: ChannelStatusCL;
  closing?: ChannelStatusCL;
}

export interface Address {
  type?: string;
  address?: string;
  port?: number;
}

export interface GetInfoChainCL {
  chain?: string;
  network?: string;
}

export interface GetInfoCL {
  id?: string;
  alias?: string;
  color?: string;
  num_peers?: number;
  num_pending_channels?: number;
  num_active_channels?: number;
  num_inactive_channels?: number;
  address?: Address[];
  binding?: Address[];
  version?: string;
  blockheight?: number;
  network?: string;
  chains?: GetInfoChainCL[];
  msatoshi_fees_collected?: number;
  fees_collected_msat?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}

export interface FeesCL {
  feeCollected?: number;
  btc_feeCollected?: number;
}

export interface BalanceCL {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
  btc_totalBalance?: number;
  btc_confBalance?: number;
  btc_unconfBalance?: number;
}

export interface LocalRemoteBalanceCL {
  localBalance: number;
  remoteBalance: number;
  btc_localBalance?: number;
  btc_remoteBalance?: number;
}

export interface PeerCL {
  id?: string;
  connected?: boolean;
  netaddr?: string[];
  globalfeatures?: string;
  localfeatures?: string;
  alias?: string;
}

export interface InvoiceCL {
  label?: string;
  bolt11?: string;
  payment_hash?: string;
  msatoshi?: number;
  amount_msat?: string;
  status?: string;
  pay_index?: number;
  msatoshi_received?: number;
  amount_received_msat?: string;
  paid_at?: number;
  description?: string;
  expires_at?: number;
  paid_at_str?: string;
  expires_at_str?: string;
}

export interface ListInvoicesCL {
  invoices?: InvoiceCL[];
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface OnChainCL {
  address?:	string;
  satoshis?: number;
  feeRate?: string;
  minconf?: number;
}

export interface HopCL {
  hop_sequence?: number;
  pubkey_alias?: string;
  chan_id?:	string;
  chan_capacity?:	string;
  amt_to_forward?:	string;
  fee?:	string;
  expiry?:	number;
  amt_to_forward_msat?:	string;
  fee_msat?: string;
  pub_key?:	string;
}

export interface PaymentCL {
  amount_msat?: string;
  amount_sent_msat?: string;
  bolt11?: string;
  created_at?: number;
  created_at_str?: string;
  destination?: string;
  id?: number;
  msatoshi?: number;
  msatoshi_sent?: number;
  payment_hash?: string;
  payment_preimage?: string;
  status?: string;
}

export interface PayRequestCL {
  currency?: string;
  created_at?: number;
  expiry?: number;
  payee?: string;
  msatoshi?: number;
  amount_msat?: string;
  description?: string;
  min_final_cltv_expiry?: number;
  payment_hash?: string;
  signature?: string;
  created_at_str?: string;
  expire_at_str?: string;
}

export interface ForwardingEventCL {
  payment_hash?: string;
  in_channel?: string;
  out_channel?: string;
  in_msatoshi?: number;
  in_msat?: string;
  out_msatoshi?: number;
  out_msat?: string;
  fee?: number;
  fee_msat?: string;
  status?: string;
  received_time?: number;
  received_time_str?: string;
  resolved_time?: number;
  resolved_time_str?: string;
}

export interface ForwardingHistoryResCL {
  last_offset_index?: number;
  forwarding_events?: ForwardingEventCL[];
}

export interface QueryRoutesCL {
  routes: RoutesCL[];
}

export interface RoutesCL {
  id?: string;
  channel?: string;
  direction?: number;
  msatoshi?: number;
  amount_msat?: string;
  delay?: number;
  alias?: string;
}

export interface ChannelCL {
  id?: string;
  alias?: string;
  connected?: boolean;
  state?: string;
  short_channel_id?: string;
  channel_id?: string;
  funding_txid?: string;
  private?: boolean;
  msatoshi_to_us?: string;
  msatoshi_total?: string;
  their_channel_reserve_satoshis?: string;
  our_channel_reserve_satoshis?: string;
  spendable_msatoshi?: string;
}

export interface ChannelEdgeCL {
  active?: boolean;
  amount_msat?: string;
  base_fee_millisatoshi?: number;
  channel_flags?: number;
  delay?: number;
  destination?: string;
  fee_per_millionth?: number;
  htlc_maximum_msat?: string;
  htlc_minimum_msat?: string;
  last_update?: number;
  last_update_str?: string;
  message_flags?: number;
  public?: boolean;
  satoshis?: number;
  short_channel_id?: string;
  source?: string;
}

export interface LookupNodeCL {
  nodeid?: string;
  alias?: string;
  color?: string;
  last_timestamp?: number;
  last_timestamp_str?: string;
  globalfeatures?: string;
  features?: string;
  addresses?: Address[];
}

export interface FeeRatesCL {
  perkb?: FeeRatePerObj,
  perkw?: FeeRatePerObj,
  onchain_fee_estimates?: {
      opening_channel_satoshis?: number;
      mutual_close_satoshis?: number;
      unilateral_close_satoshis?: number;
  }
}

export interface FeeRatePerObj {
  urgent?: number;
  normal?: number;
  slow?: number;
  min_acceptable?: number;
  max_acceptable?: number;
}