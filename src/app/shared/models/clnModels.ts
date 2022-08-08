import { CLNForwardingEventsStatusEnum, PaymentTypes } from '../services/consts-enums-functions';

export enum feeRateStyle {
  KB = 'KB',
  KW = 'KW'
}

export interface ChannelStatus {
  channels?: number;
  capacity?: number;
}

export interface ChannelsStatus {
  active: ChannelStatus;
  inactive: ChannelStatus;
  pending: ChannelStatus;
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
  lnImplementation?: string;
}

export interface Fees {
  feeCollected?: number;
  totalTxCount?: number;
}

export interface Balance {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
}

export interface LocalRemoteBalance {
  localBalance: number;
  remoteBalance: number;
  pendingBalance?: number;
  inactiveBalance?: number;
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
  bolt12?: string;
  payment_hash?: string;
  msatoshi?: number;
  amount_msat?: string;
  status?: string;
  pay_index?: number;
  msatoshi_received?: number;
  amount_received_msat?: string;
  paid_at?: number;
  payment_preimage?: string;
  description?: string;
  expires_at?: number;
  warning_capacity?: string;
  local_offer_id?: string;
}

export interface Offer {
  offer_id?: string;
  active?: boolean;
  single_use?: boolean;
  bolt12?: string;
  bolt12_unsigned?: string;
  used?: boolean;
}

export interface OfferBookmark {
  lastUpdatedAt?: string;
  bolt12?: string;
  amountmSat?: number;
  title?: string;
  vendor?: string;
  description?: string;
}

export interface ListInvoices {
  invoices?: Invoice[];
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface OnChain {
  address?: string;
  satoshis?: string;
  feeRate?: string;
  minconf?: number;
  utxos?: string[];
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
}

export interface MPP {
  amount_msat?: string;
  amount_sent_msat?: string;
  bolt11?: string;
  created_at?: number;
  destination?: string;
  id?: number;
  msatoshi?: number;
  msatoshi_sent?: number;
  payment_hash?: string;
  payment_preimage?: string;
  status?: string;
  partid?: number;
}

export interface Payment {
  amount_msat?: string;
  amount_sent_msat?: string;
  bolt11?: string;
  bolt12?: string;
  created_at?: number;
  destination?: string;
  id?: number;
  msatoshi?: number;
  msatoshi_sent?: number;
  payment_hash?: string;
  payment_preimage?: string;
  status?: string;
  memo?: string;
  partid?: string;
  is_group?: boolean;
  is_expanded?: boolean;
  total_parts?: number;
  mpps?: MPP[];
}

export interface PayRequest {
  type?: string;
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
}

interface HopObj {
  node_id: string;
  enctlv: string;
}
interface Paths {
  blinding: string;
  path: HopObj[];
}
interface PayWindow {
  seconds_before: number;
  seconds_after: number;
  proportional_amount?: boolean;
}
interface Recurrence {
  time_unit: number;
  period: number;
  time_unit_name?: string;
  basetime?: number;
  start_any_period?: number;
  limit?: number;
  paywindow?: PayWindow;
}

export interface OfferRequest {
  type?: string;
  valid?: boolean;
  offer_id?: string;
  node_id?: string;
  description?: string;
  signature?: string;
  chains?: string[];
  issuer?: string;
  currency?: string;
  minor_unit?: number;
  amount?: number;
  amount_msat?: string;
  send_invoice?: boolean;
  refund_for?: string;
  vendor?: string;
  features?: string;
  absolute_expiry?: string;
  paths?: Paths[];
  quantity_min?: number;
  quantity_max?: number;
  recurrence?: Recurrence;
}

interface Changes {
  description_appended?: string;
  description?: string;
  vendor_removed?: string;
  vendor?: string;
  msat?: string;
}

interface NextPeriod {
  counter: string;
  starttime: string;
  endtime: string;
  paywindow_start: string;
  paywindow_end: string;
}

export interface OfferInvoice {
  invoice: string;
  changes: Changes;
  next_period?: NextPeriod;
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
  resolved_time?: number;
}

export interface LocalFailedEvent {
  in_channel?: string;
  in_channel_alias?: string;
  in_msatoshi?: number;
  in_msat?: string;
  status?: string;
  received_time?: number;
  failcode?: number;
  failreason?: string;
}

export interface ListForwards {
  status?: CLNForwardingEventsStatusEnum;
  offset?: number;
  maxLen?: number;
  totalForwards?: number;
  listForwards?: ForwardingEvent[] | LocalFailedEvent[];
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

export interface QueryRoutes {
  routes: Routes[];
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
  tor_node?: boolean;
  features?: string;
  channelCount?: number;
  nodeCapacity?: number;
  channelOpeningFee?: number;
  addresses?: Address[];
  option_will_fund?: {
    lease_fee_base_msat?: number;
    lease_fee_basis?: number;
    funding_weight?: number;
    channel_fee_max_base_msat?: number;
    channel_fee_max_proportional_thousandths?: number;
    compact_lease?: string;
  };
}

export interface FeeRatePerObj {
  min_acceptable?: number;
  max_acceptable?: number;
  opening?: number;
  mutual_close?: number;
  unilateral_close?: number;
  delayed_to_us?: number;
  htlc_resolution?: number;
  penalty?: number;
}

export interface OnChainFeeEstimates {
  opening_channel_satoshis?: number;
  mutual_close_satoshis?: number;
  unilateral_close_satoshis?: number;
  htlc_timeout_satoshis?: number;
  htlc_success_satoshis?: number;
}

export interface FeeRates {
  perkb?: FeeRatePerObj;
  perkw?: FeeRatePerObj;
  onchain_fee_estimates?: OnChainFeeEstimates;
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

export interface RoutingPeer {
  channel_id?: string;
  alias?: string;
  events?: number;
  total_amount?: number;
  total_fee?: number;
}

export interface SaveChannel {
  peerId: string;
  satoshis: string;
  announce?: boolean;
  feeRate?: string;
  minconf?: number;
  utxos?: string[];
  requestAmount?: string;
  compactLease?: string;
}

export interface GetNewAddress {
  addressId?: string;
  addressCode?: string;
  addressTp?: string;
  addressDetails?: string;
}

export interface DetachPeer {
  id: string;
  force: boolean;
}

export interface UpdateChannel {
  channelId: string;
  baseFeeMsat: number;
  feeRate: number;
}

export interface CloseChannel {
  id: string;
  channelId: string;
  force: boolean;
}

export interface DecodePayment {
  routeParam: string;
  fromDialog: boolean;
}

export interface SendPayment {
  uiMessage: string;
  fromDialog: boolean;
  paymentType: PaymentTypes;
  title?: string;
  vendor?: string;
  invoice?: string;
  description?: string;
  saveToDB?: boolean;
  bolt12?: string;
  amount?: number;
  zeroAmtOffer?: boolean;
  pubkey?: string;
}

export interface GetQueryRoutes {
  destPubkey: string;
  amount: number;
}

export interface ChannelLookup {
  uiMessage: string;
  shortChannelID: string;
  showError: boolean;
}

export interface FetchInvoices {
  num_max_invoices?: number;
  index_offset?: number;
  reversed?: boolean;
}

export interface FunderPolicy {
  summary?: string;
  policy?: string;
  policy_mod?: number;
  leases_only?: boolean;
  min_their_funding_msat?: string;
  max_their_funding_msat?: string;
  per_channel_min_msat?: string;
  per_channel_max_msat?: string;
  reserve_tank_msat?: string;
  fuzz_percent?: number;
  fund_probability?: number;
  lease_fee_base_msat?: number;
  lease_fee_basis?: number;
  funding_weight?: number;
  channel_fee_max_base_msat?: number;
  channel_fee_max_proportional_thousandths?: number;
}

export interface FetchListForwards {
  status?: string;
  maxLen?: number;
  offset?: number;
}
