export enum feeRateStyle {
  KB = 'KB',
  KW = 'KW'
}

export interface Address {
  type?: string;
  address?: string;
  port?: number;
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
  msatoshi_fees_collected?: number;
  fees_collected_msat?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
}

export interface FeesCL {
  feeCollected?: number;
  btc_feeCollected?: number;
}

export interface BalanceCL {
  totalBalance?: string;
  confBalance?: string;
  unconfBalance?: string;
  btc_totalBalance?: string;
  btc_confBalance?: string;
  btc_unconfBalance?: string;
}

export interface LocalRemoteBalanceCL {
  localBalance?: number;
  remoteBalance?: number;
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
  memo?: string;
  receipt?: string;
  r_preimage?: string;
  r_hash?: string;
  value?: string;
  btc_value?: string;
  settled?: boolean;
  creation_date?: string;
  creation_date_str?: string;
  settle_date?: string;
  settle_date_str?: string;
  payment_request?: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: any[];
  private?: boolean;
  add_index?: string;
  settle_index?: string;
  amt_paid?: string;
  amt_paid_sat?: string;
  btc_amt_paid_sat?: string;
  amt_paid_msat?: string;
}

export interface OnChainCL {
  address?:	string;
  amount?: number;
  sendAll?: boolean;
  blocks?: number;
  fees?: number;
}

export interface AddressTypeCL {
  addressId?: string;
  addressTp?: string;
  addressDetails?: string;
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
  payment_hash?: string;
  route_hints?: any[];
  timestamp?: number;
  timestamp_str?: string;
  fallback_addr?: string;
  cltv_expiry?: number;
  description_hash?: string;
  destination?: string;
  expiry?: number;
  description?: string;
  num_satoshis?: string;
  btc_num_satoshis?: string;
}

export interface ForwardingEventCL {
  timestamp?: string;
  timestamp_str?: string;
  chan_id_out?: string;
  alias_out?: string;
  amt_out?: string;
  amt_in?: string;
  chan_id_in?: string;
  alias_in?: string;
  fee?: string;
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
  peer_id?: string;
  peer_alias?: string;
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
  global_features?: string;
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