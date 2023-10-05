export interface ChannelStatus {
  num_channels?: number;
  capacity?: number;
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

export interface LightningBalance {
  local?: number;
  remote?: number;
}

export interface BlockchainBalance {
  total_balance?: number;
  confirmed_balance?: number;
  unconfirmed_balance?: number;
  account_balance?: any;
}

export interface ChannelFeeReport {
  chan_point?: string;
  base_fee_msat?: number;
  fee_per_mil?: number;
  fee_rate?: number;
}

export interface ChannelHTLC {
  incoming?: boolean;
  amount?: string;
  hash_lock?: string;
  expiration_height?: number;
  htlc_index?: number;
  forwarding_channel?: string;
  forwarding_htlc_index?: number;
}

export interface ChannelsSummary {
  active?: {
    num_channels?: number;
    capacity?: number;
  };
  inactive?: {
    num_channels?: number;
    capacity?: number;
  };
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
  pending_htlcs?: ChannelHTLC[];
  csv_delay?: number;
  initiator?: boolean;
  chan_status_flags?: string;
  close_address?: string;
  remote_chan_reserve_sat?: string;
  local_chan_reserve_sat?: string;
  uptime?: string;
  uptime_str?: string;
  lifetime?: string;
  lifetime_str?: string;
  static_remote_key?: boolean;
  balancedness?: number; // Between 0-1-0
}

export interface PendingChannel {
  remote_alias?: string;
  remote_node_pub?: string;
  channel_point?: string;
  txid_str?: string;
  output_index?: number | null;
  capacity?: string;
  local_balance?: string;
  remote_balance?: string;
  local_chan_reserve_sat?: string;
  remote_chan_reserve_sat?: string;
  initiator?: string;
  commitment_type?: string;
}

export interface PendingClosingChannel {
  channel?: PendingChannel;
  closing_txid?: string;
}

export interface PendingForceClosingChannel {
  channel?: PendingChannel;
  closing_txid?: string;
  limbo_balance?: string;
  maturity_height?: number;
  blocks_til_maturity?: number;
  recovered_balance?: string;
  pending_htlcs?: Array<any>;
  anchor?: string;
}

export interface PendingOpenChannel {
  channel?: PendingChannel;
  confirmation_height?: number;
  commit_fee?: string;
  commit_weight?: string;
  fee_per_kw?: string;
}

export interface WaitingCloseChannel {
  channel?: PendingChannel;
  limbo_balance?: string;
  commitments?: any;
  closing_txid?: string;
}

export interface PendingChannels {
  total_limbo_balance?: number;
  pending_closing_channels?: Array<PendingClosingChannel>;
  pending_force_closing_channels?: Array<PendingForceClosingChannel>;
  pending_open_channels?: Array<PendingOpenChannel>;
  waiting_close_channels?: Array<WaitingCloseChannel>;
}

export interface ClosedChannel {
  time_locked_balance?: string;
  closing_tx_hash?: string;
  close_type?: any;
  close_height?: number;
  chain_hash?: string;
  channel_point?: string;
  chan_id?: string;
  remote_alias?: string;
  remote_pubkey?: string;
  capacity?: string;
  settled_balance?: string;
  open_initiator?: string;
  close_initiator?: string;
}

export interface NodeAddress {
  network?: string;
  addr?: string;
}

export interface LightningNode {
  last_update?: number;
  pub_key?: string;
  alias?: string;
  addresses?: NodeAddress[];
  color?: string;
  features?: any;
}

export interface RoutingPolicy {
  time_lock_delta?: number;
  min_htlc?: string;
  max_htlc_msat?: string;
  fee_base_msat?: string;
  fee_rate_milli_msat?: string;
  disabled?: boolean;
}

export interface ChannelEdge {
  channel_id?: string;
  chan_point?: string;
  last_update?: number;
  node1_pub?: string;
  node2_pub?: string;
  capacity?: string;
  node1_policy?: RoutingPolicy;
  node2_policy?: RoutingPolicy;
}

export interface NetworkGraph {
  nodes: LightningNode[];
  edges: ChannelEdge[];
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

export interface ForwardingEvent {
  timestamp?: number;
  chan_id_out?: string;
  alias_out?: string;
  amt_out?: string;
  amt_out_msat?: string;
  amt_in?: string;
  amt_in_msat?: string;
  chan_id_in?: string;
  alias_in?: string;
  fee?: string;
  fee_msat?: string;
}

export interface SwitchRes {
  last_offset_index?: number;
  total_fee_msat?: number;
  forwarding_events?: ForwardingEvent[];
}

export interface Fees {
  channel_fees?: ChannelFeeReport[];
  day_fee_sum?: number;
  week_fee_sum?: number;
  month_fee_sum?: number;
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
  lnImplementation?: string;
}

export interface GraphNode {
  node?: LightningNode;
  channels: any[];
  num_channels?: number;
  total_capacity?: string;
}

export interface HopHint {
  cltv_expiry_delta?: number;
  node_id?: string;
  chan_id?: string;
  fee_proportional_millionths?: number;
  fee_base_msat?: number;
}

export interface Hop {
  hop_sequence?: number;
  pubkey_alias?: string;
  chan_id?: string;
  chan_capacity?: string;
  amt_to_forward?: string;
  fee?: string;
  expiry?: number;
  amt_to_forward_msat?: string;
  fee_msat?: string;
  pub_key?: string;
  tlv_payload?: boolean;
  mpp_record?: { payment_addr?: string, total_amt_msat?: number };
  custom_records?: any;
}

export interface Route {
  total_time_lock?: number;
  total_fees?: string;
  total_amt?: string;
  hops?: Hop[];
  total_fees_msat?: string;
  total_amt_msat?: string;
}

export interface PaymentHTLC {
  status?: string;
  route?: Route;
  attempt_time_ns?: string;
  resolve_time_ns?: string;
  failure?: any;
  preimage?: string;
}

export interface InvoiceHTLC {
  chan_id?: string;
  htlc_index?: string;
  amt_msat?: string;
  accept_height?: number;
  accept_time?: string;
  resolve_time?: string;
  expiry_height?: number;
  state?: string;
  custom_records?: any;
  mpp_total_amt_msat?: string;
}

export interface RouteHint {
  hop_hints?: HopHint[];
}

export interface Invoice {
  memo?: string;
  r_preimage?: string;
  r_hash?: string;
  value?: string;
  value_msat?: string;
  settled?: boolean;
  creation_date?: number;
  settle_date?: number;
  payment_request?: string;
  description_hash?: string;
  expiry?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  route_hints?: RouteHint[];
  private?: boolean;
  add_index?: string;
  settle_index?: string;
  amt_paid?: string;
  amt_paid_sat?: string;
  amt_paid_msat?: string;
  state?: string;
  htlcs?: InvoiceHTLC[];
  features?: any;
  is_keysend?: boolean;
  payment_addr?: string;
  is_amp?: boolean;
  amp_invoice_state?: any;
}

export interface ListInvoices {
  invoices?: Invoice[];
  total_invoices?: number;
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface NetworkInfo {
  num_nodes?: number;
  max_channel_size?: string;
  avg_channel_size?: string;
  graph_diameter?: number;
  num_channels?: number;
  max_out_degree?: number;
  total_network_capacity?: string;
  avg_out_degree?: number;
  min_channel_size?: string;
}

export interface Payment {
  creation_date?: number;
  payment_hash?: string;
  payment_request?: string;
  status?: string;
  fee?: number;
  fee_sat?: number;
  fee_msat?: number;
  value_msat?: number;
  value_sat?: number;
  value?: number;
  payment_preimage?: string;
  creation_time_ns?: string;
  payment_index?: string;
  failure_reason?: string;
  htlcs: PaymentHTLC[];
  is_expanded?: boolean;
  description?: string;
  description_hash?: string;
}

export interface ListPayments {
  payments?: Payment[];
  first_index_offset?: string;
  last_index_offset?: string;
}

export interface PayRequest {
  payment_hash?: string;
  route_hints?: RouteHint[];
  timestamp?: string;
  fallback_addr?: string;
  cltv_expiry?: string;
  description_hash?: string;
  destination?: string;
  expiry?: string;
  description?: string;
  payment_addr?: string;
  num_msat?: string;
  num_satoshis?: string;
  features?: any;
}

export interface Peer {
  pub_key?: string;
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

export interface ChannelsTransaction {
  address?: string;
  amount?: number;
  sendAll?: boolean;
  blocks?: number;
  fees?: number;
}

export interface Transaction {
  dest_addresses?: string[];
  time_stamp?: number;
  num_confirmations?: number;
  total_fees?: string;
  block_hash?: string;
  block_height?: number;
  tx_hash?: string;
  amount?: string;
  label?: string;
}

export interface UTXO {
  address_type?: string;
  address?: string;
  amount_sat?: string;
  pk_script?: string;
  outpoint?: { txid_bytes?: string, txid_str?: string, output_index?: number };
  confirmations?: string;
  label?: string;
}

export interface SwitchReq {
  num_max_events?: number;
  index_offset?: number;
  end_time?: string;
  start_time?: string;
}

export interface RoutingPeers {
  chan_id?: string;
  alias?: string;
  events?: number;
  total_amount?: number;
}

export interface PendingChannelsData {
  num_channels: number;
  limbo_balance: number;
}

export interface PendingChannelsSummary {
  open?: PendingChannelsData;
  closing?: PendingChannelsData;
  force_closing?: PendingChannelsData;
  waiting_close?: PendingChannelsData;
  total_channels?: number;
  total_limbo_balance?: number;
}

export interface SavePeer {
  pubkey: string;
  host: string;
  perm: boolean;
}

export interface SaveInvoice {
  uiMessage: string;
  memo: string;
  value: number;
  private: boolean;
  expiry: number;
  pageSize: number;
  openModal: boolean;
  is_amp: boolean;
}

export interface SaveChannel {
  selectedPeerPubkey: string;
  fundingAmount: number;
  private: boolean;
  transType: string;
  transTypeValue: string;
  spendUnconfirmed: boolean;
  channelType: string;
}

export interface CloseChannel {
  channelPoint: string;
  forcibly: boolean;
  targetConf?: number;
  satPerByte?: number;
}

export interface FetchInvoices {
  num_max_invoices?: number;
  index_offset?: number;
  reversed?: boolean;
}

export interface FetchPayments {
  max_payments?: number;
  index_offset?: number;
  reversed?: boolean;
}

export interface SendPayment {
  uiMessage: string;
  fromDialog: boolean;
  paymentReq: string;
  paymentAmount?: number;
  outgoingChannel?: Channel | null;
  feeLimitType?: string;
  feeLimit?: number | null;
  allowSelfPayment?: boolean;
  lastHopPubkey?: string;
}

export interface GetNewAddress {
  addressId?: string;
  addressCode?: string;
  addressTp?: string;
  addressDetails?: string;
}

export interface GetQueryRoutes {
  destPubkey: string;
  amount: number;
  outgoingChanId?: string;
}

export interface InitWallet {
  pwd: string;
  cipher?: Array<string>;
  passphrase?: string;
}

export interface ChannelLookup {
  uiMessage: string;
  channelID: string;
}

export interface SetRestoreChannelsList {
  all_restore_exists: boolean;
  files: [];
}

export interface NewlyAddedPeer {
  peer: Peer;
  balance: number;
}

export interface SetPendingChannels {
  pendingChannels: PendingChannels;
  pendingChannelsSummary: PendingChannelsSummary;
}

export interface BackupChannels {
  uiMessage: string;
  channelPoint: string;
  showMessage: string;
}

export interface SetAllLightningTransactions {
  listPaymentsAll: ListPayments;
  listInvoicesAll: ListInvoices;
}
