import { SwapStateEnum, SwapTypeEnum } from '../services/consts-enums-functions';

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

export interface AddressType {
  addressId?: string;
  addressTp?: string;
  addressDetails?: string;
}

export interface Balance {
  btc_balance?: number;
  balance?: number;
  btc_pending_open_balance?: number;
  pending_open_balance?: number;
  btc_total_balance?: number;
  total_balance?: number;
  btc_confirmed_balance?: number;
  confirmed_balance?: number;
  btc_unconfirmed_balance?: number;
  unconfirmed_balance?: number;
}

export interface ChannelFeeReport {
  chan_point?: string;
  base_fee_msat?: number;
  fee_per_mil?: number;
  fee_rate?: number;
}

export interface Channel {
  active?: boolean;
  remote_pubkey?: string;
  remote_alias?: string;
  channel_point?: string;
  chan_id?: string;
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
  pending_htlcs?: HTLC[];
  csv_delay?: number;
  initiator?: boolean;
  chan_status_flags?: string;
  close_address?: string;
  remote_chan_reserve_sat?: string;
  local_chan_reserve_sat?: string;
  uptime?: string;
  uptime_str?: string;
  lifetime?: string;
  static_remote_key?: boolean; 
  balancedness?: number; // Between -1 to +1
}

export interface PendingChannels {
  total_limbo_balance?: number;
  btc_total_limbo_balance?: number;
  pending_closing_channels?: Array<any>;
  pending_force_closing_channels?: Array<any>;
  pending_open_channels?: Array<any>;
  waiting_close_channels?: Array<any>;
}

export interface ClosedChannel {
  time_locked_balance?: string;
  closing_tx_hash?: string;
  close_type?: any;
  close_height?: number;
  chain_hash?: string;
  channel_point?: string;
  chan_id?: string;
  remote_pubkey?: string;
  capacity?: string;
  settled_balance?: string;
}

export interface NetworkGraph {
  nodes: LightningNode[];
  edges: ChannelEdge[];
}

export interface LightningNode {
  last_update?: number;
  pub_key?: string;
  alias?: string;
  addresses?:	NodeAddress[];
  color?: string;
}

export interface NodeAddress {
  network?: string;
  addr?: string;
}

export interface ChannelEdge {
  channel_id?: string;
  chan_point?: string;
  last_update?: number;
  last_update_str?: string;
  node1_pub?: string;
  node2_pub?: string;
  capacity?: string;
  node1_policy?: RoutingPolicy;
  node2_policy?: RoutingPolicy;
}

export interface RoutingPolicy {
  time_lock_delta?: number;
  min_htlc?: string;
  fee_base_msat?: string;
  fee_rate_milli_msat?: string;
  disabled?: boolean;
}

export interface SigmaNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
}

export interface SigmaEdge {
  id: string;
  source: string;
  target: string;
}

export interface FeeLimit {
  percent?: number;
  fixed?: number;
}

export interface Fees {
  channel_fees?: ChannelFeeReport[];
  day_fee_sum?: number;
  week_fee_sum?: number;
  month_fee_sum?: number;
  btc_day_fee_sum?: number;
  btc_week_fee_sum?: number;
  btc_month_fee_sum?: number;
  daily_tx_count?: number;
  weekly_tx_count?: number;
  monthly_tx_count?: number;
  forwarding_events_history?: SwitchRes;
}

export interface GetInfoChain {
    chain?: string;
    network?: string;
}

export interface GetInfo {
  identity_pubkey?: string;
  alias?: string;
  color?: string;
  num_pending_channels?: number;
  num_active_channels?: number;
  num_peers?: number;
  block_height?: number;
  block_hash?: string;
  synced_to_chain?: boolean;
  testnet?: boolean;
  chains?: GetInfoChain[] | string[];
  uris?: string[];
  best_header_timestamp?: number;
  version?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}

export interface GraphNode {
  node?: LightningNode;
  num_channels?: number;
  total_capacity?: string;
}

export interface HopHint {
  cltv_expiry_delta?: number;
  node_id?: string;
  chan_id?: number;
  fee_proportional_millionths?: number;
  fee_base_msat?: number;
}

export interface HTLC {
  incoming?: boolean;
  amount?: number;
  hash_lock?: string;
  expiration_height?: number;
}

export interface Invoice {
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
  state?: string;
  route_hints?: RouteHint[];
  private?: boolean;
  add_index?: string;
  settle_index?: string;
  amt_paid?: string;
  amt_paid_sat?: string;
  btc_amt_paid_sat?: string;
  amt_paid_msat?: string;
}

export interface ListInvoices {
  invoices?: Invoice[];
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface LightningNode {
  last_update?: number;
  last_update_str?: string;
  pub_key?: string;
  alias?: string;
  addresses?: NodeAddress[];
  color?: string;
}

export interface NetworkInfo {
  num_nodes?: number;
  btc_max_channel_size?: string;
  max_channel_size?: string;
  btc_avg_channel_size?: string;
  avg_channel_size?: string;
  graph_diameter?: number;
  num_channels?: number;
  max_out_degree?: number;
  btc_total_network_capacity?: string;
  total_network_capacity?: string;
  avg_out_degree?: number;
  btc_min_channel_size?: string;
  min_channel_size?: string;
}

export interface NodeAddress {
  network?: string;
  address?: string;
}

export interface Payment {
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

export interface PayRequest {
  payment_hash?: string;
  route_hints?: RouteHint[];
  timestamp?: number;
  timestamp_str?: string;
  fallback_addr?: string;
  cltv_expiry?: number;
  description_hash?: string;
  destination?: string;
  expiry?: number;
  description?: string;
  num_msat?: string;
  num_satoshis?: string;
  btc_num_satoshis?: string;
}

export interface Peer {
  pub_key?:	string;
  alias?: string;
  address?: string;
  bytes_sent?: number;
  bytes_recv?: number;
  sat_sent?: string;
  sat_recv?: string;
  inbound?: boolean;
  ping_time?: number;
  sync_type?: string;
}

export interface QueryRoutes {
  routes?: Route[];
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

export interface Route {
  total_time_lock?:	number;
  total_fees?: string;
  total_amt?: string;
  hops?: Hop[];
  total_fees_msat?: string;
  total_amt_msat?: string;
}

export interface RouteHint {
  hop_hints?: HopHint[];
}

export interface SendPayment {
  dest_string?: string;
  dest?: string;
  payment_hash_string?: string;
  payment_request?: string;
  fee_limit?: FeeLimit;
  amt?: number;
  payment_hash?: string;
  final_cltv_delta?: number;
}

export interface SendCoins {
  addr: string;
  amount: number;
}

export interface ChannelsTransaction {
  address?:	string;
  amount?: number;
  sendAll?: boolean;
  blocks?: number;
  fees?: number;
}

export interface Transaction {
  dest_addresses?: string[];
  time_stamp?: string;
  time_stamp_str?: string;
  num_confirmations?: number;
  total_fees?: string;
  block_hash?: string;
  block_height?: number;
  tx_hash?: string;
  amount?: string;
}

export interface SwitchReq {
  num_max_events?: number;
  index_offset?: number;
  end_time?: string;
  start_time?: string;
}

export interface ForwardingEvent {
  timestamp?: string;
  timestamp_str?: string;
  chan_id_out?: string;
  alias_out?: string;
  amt_out?: string;
  amt_in?: string;
  chan_id_in?: string;
  alias_in?: string;
  fee?: string;
  fee_msat?: string;
}

export interface RoutingPeers {
  chan_id?: string;
  alias?: string;
  events?: number;
  total_amount?: number;
}

export interface SwitchRes {
  last_offset_index?: number;
  forwarding_events?: ForwardingEvent[];
}

export interface PendingChannelsGroup {
  open?: PendingChannelsData;
  closing?: PendingChannelsData;
  force_closing?: PendingChannelsData;
  waiting_close?: PendingChannelsData;
  total_channels?: number;
  total_limbo_balance?: number;
}

export interface PendingChannelsData {
  num_channels: number;
  limbo_balance: number;
}

export interface SwapStatus {
  type?: SwapTypeEnum;
  cost_server?: string;
  cost_offchain?: string;
  htlc_address?: string;
  state?: SwapStateEnum;
  amt?: string;
  cost_onchain?: string;
  initiation_time?: string;
  initiation_time_str?: string;
  id_bytes?: string;
  last_update_time?: string;
  last_update_time_str?: string;
  id?: string;
}

