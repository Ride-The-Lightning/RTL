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
  fees_collected_msat?: number;
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
  amount_msat?: number;
  status?: string;
  pay_index?: number;
  amount_received_msat?: number;
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
  used?: boolean;
  created?: boolean;
  label?: string;
}

export interface OfferBookmark {
  lastUpdatedAt?: string;
  bolt12?: string;
  amountMSat?: number;
  title?: string;
  issuer?: string;
  description?: string;
}

export interface ListInvoices {
  invoices?: Invoice[];
  last_index_offset?: string;
  first_index_offset?: string;
}

export interface OnChain {
  destination?: string;
  satoshi?: string;
  feerate?: string;
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
  bolt11?: string;
  created_at?: number;
  destination?: string;
  id?: number;
  amount_msat?: number;
  amount_sent_msat?: number;
  payment_hash?: string;
  payment_preimage?: string;
  status?: string;
  partid?: number;
}

export interface Payment {
  bolt11?: string;
  bolt12?: string;
  created_at?: number;
  destination?: string;
  id?: number;
  amount_msat?: number;
  amount_sent_msat?: number;
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
  amount_msat?: number;
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
  offer_id?: string;
  offer_amount_msat?: number;
  type?: string;
  valid?: boolean;
  offer_node_id?: string;
  offer_description?: string;
  offer_issuer?: string;
  offer_chains?: string[];
  offer_absolute_expiry?: number;
  offer_quantity_max?: number;
}

interface Changes {
  description_appended?: string;
  description?: string;
  issuer_removed?: string;
  issuer?: string;
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
  in_msat?: number;
  out_msat?: number;
  fee_msat?: number;
  status?: string;
  received_time?: number;
  resolved_time?: number;
}

export interface LocalFailedEvent {
  in_channel?: string;
  in_channel_alias?: string;
  in_msat?: number;
  out_channel?: string;
  out_channel_alias?: string;
  status?: string;
  received_time?: number;
  resolved_time?: number;
  failcode?: number;
  failreason?: string;
}

export interface ListForwards {
  status?: CLNForwardingEventsStatusEnum;
  totalForwards?: number;
  listForwards?: ForwardingEvent[] | LocalFailedEvent[];
}

export interface Routes {
  id?: string;
  channel?: string;
  direction?: number;
  amount_msat?: number;
  delay?: number;
  alias?: string;
}

export interface QueryRoutes {
  routes: Routes[];
}

export interface ChannelHTLC {
  direction?: string;
  id?: string;
  amount_msat?: number;
  expiry?: number;
  payment_hash?: string;
  state?: string;
  local_trimmed?: boolean;
}

export interface Channel {
  id?: string; // For Backward compatibility
  peer_id?: string;
  alias?: string;
  connected?: boolean; // For Backward compatibility
  peer_connected?: boolean;
  state?: string;
  short_channel_id?: string;
  channel_id?: string;
  funding_txid?: string;
  private?: boolean;
  to_us_msat?: number;
  to_them_msat?: number;
  total_msat?: number;
  their_reserve_msat?: number;
  our_reserve_msat?: number;
  spendable_msat?: number;
  direction?: number;
  htlcs?: ChannelHTLC[];
  receivable_msat?: number;
  fee_base_msat?: number;
  fee_proportional_millionths?: number;
  dust_limit_msat?: number;
  balancedness?: number; // Between 0-1-0
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
  address_types?: string[];
  features?: string;
  channel_count?: number;
  node_capacity?: number;
  channel_opening_fee?: number;
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

export interface FeeBlockEstimates {
  blockcount?: number;
  feerate?: number;
  smoothed_feerate?: number;
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
  floor?: number;
  estimates?: FeeBlockEstimates[];
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
  amount_msat?: number;
  status?: string;
  blockheight?: string;
  scriptpubkey?: string;
  address?: string;
  reserved?: boolean;
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
  minconf?: number | null;
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
  destination?: string;
  amount_msat?: number;
  label?: string;
  maxfeepercent?: number;
  retry_for?: number;
  maxdelay?: number;
  exemptfee?: number;
  extratlvs?: any;
  title?: string;
  issuer?: string;
  bolt11?: string;
  description?: string;
  bolt12?: string;
  zeroAmtOffer?: boolean;
  pubkey?: string;
  riskfactor?: number;
  localinvreqid?: string;
  exclude?: string[];
  maxfee?: number;
  saveToDB?: boolean;
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
}
