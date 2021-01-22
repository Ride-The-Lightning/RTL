export enum feeRateStyle {
  KB = 'KB',
  KW = 'KW'
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

export interface Address {
  type?: string;
  address?: string;
  port?: number;
}

export interface GetInfoChain {
  chain?: string;
  network?: string;
}

export interface GetInfo {
  id?: string;
  api_version?: string;
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
  chains?: GetInfoChain[];
  msatoshi_fees_collected?: number;
  fees_collected_msat?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}

export interface Fees {
  feeCollected?: number;
  btc_feeCollected?: number;
  totalTxCount?: number;
}

export interface Balance {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
  btc_totalBalance?: number;
  btc_confBalance?: number;
  btc_unconfBalance?: number;
}

export interface LocalRemoteBalance {
  localBalance: number;
  remoteBalance: number;
  pendingBalance?: number;
  inactiveBalance?: number;
  btc_localBalance?: number;
  btc_remoteBalance?: number;
  btc_pendingBalance?: number;
  btc_inactiveBalance?: number;
}

export interface Peer {
  id?: string;
  connected?: boolean;
  netaddr?: string[];
  alias?: string;
}

export interface Invoice {
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
  warning_capacity?: string;
}

export interface ListInvoices {
  invoices?: Invoice[];
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface OnChain {
  address?:	string;
  satoshis?: string;
  feeRate?: string;
  minconf?: number;
  utxos?: string[];
}

export interface Hop {
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

export interface Payment {
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
  is_group?: boolean;
  is_expanded?: boolean;
  total_parts?: number;
  mpps?: MPP[];
}

export interface MPP {
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
  partid?: number;
}

export interface PayRequest {
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

export interface ForwardingEvent {
  payment_hash?: string;
  in_channel?: string;
  out_channel?: string;
  in_channel_alias?: string;
  out_channel_alias?: string;
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

export interface ForwardingHistoryRes {
  last_offset_index?: number;
  forwarding_events?: ForwardingEvent[];
}

export interface QueryRoutes {
  routes: Routes[];
}

export interface Routes {
  id?: string;
  channel?: string;
  direction?: number;
  msatoshi?: number;
  amount_msat?: string;
  delay?: number;
  alias?: string;
}

export interface Channel {
  id?: string;
  alias?: string;
  connected?: boolean;
  state?: string;
  short_channel_id?: string;
  channel_id?: string;
  funding_txid?: string;
  private?: boolean;
  msatoshi_to_us?: number;
  msatoshi_to_them?: number;
  msatoshi_total?: number;
  their_channel_reserve_satoshis?: string;
  our_channel_reserve_satoshis?: string;
  spendable_msatoshi?: string;
  balancedness?: number; // Between -1 to +1
}

export interface ChannelEdge {
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

export interface LookupNode {
  nodeid?: string;
  alias?: string;
  color?: string;
  last_timestamp?: number;
  last_timestamp_str?: string;
  features?: string;
  addresses?: Address[];
}

export interface FeeRates {
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

export interface UTXO {
  txid?: string;
  output?: number;
  value?: number;
  status?: string;
  blockheight?: string;
  address?: string;
  amount_msat?: string;
}
