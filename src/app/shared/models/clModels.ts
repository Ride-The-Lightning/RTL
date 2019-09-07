export interface GetInfoAddress {
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
  address?: GetInfoAddress[];
  binding?: GetInfoAddress[];
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

export interface ChannelCL {
  active?: boolean;
  remote_pubkey?: string;
  remote_alias?: string;
  channel_point?: string;
  chan_id?: number;
  capacity?: number;
  local_balance?: number;
  remote_balance?: number;
  commit_fee?: number;
  commit_weight?: number;
  fee_per_kw?: number;
  unsettled_balance?: number;
  total_satoshis_sent?: number;
  total_satoshis_received?: number;
  num_updates?: number;
  private?: boolean;
  pending_htlcs?: any[];
  csv_delay?: number;
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

export interface ChannelEdgeCL {
  channel_id?: string;
  chan_point?: string;
  last_update?: number;
  last_update_str?: string;
  node1_pub?: string;
  node2_pub?: string;
  capacity?: string;
  node1_policy?: any;
  node2_policy?: any;
}

export interface GraphNodeCL {
  node?: any;
  num_channels?: number;
  total_capacity?: string;
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
  creation_date?: number;
  creation_date_str?: string;
  payment_hash?: string;
  path?: string[];
  fee?: number;
  value_msat?: number;
  value_sat?: number;
  value?: number;
  payment_preimage?: string;
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