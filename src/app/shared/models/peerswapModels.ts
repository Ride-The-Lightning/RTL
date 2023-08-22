export interface PeerswapPolicy {
  min_swap_amount_msat: number;
  accept_all_peers?: boolean;
  allow_new_swaps?: boolean;
  allowlisted_peers?: string[];
  reserve_onchain_msat?: number;
  suspicious_peers?: string[];
}

export interface SwapOutRequest {
  protocol_version?: number;
  swap_id?: string;
  asset?: string;
  network?: string;
  scid?: string;
  amount?: number;
  pubkey?: string;
}

export interface SwapOutAgreement {
  protocol_version?: number;
  swap_id?: string;
  pubkey?: string;
  Payreq?: string;
}

export interface OpeningTxBroadcasted {
  swap_id?: string;
  payreq?: string;
  tx_id?: string;
  script_out?: number;
  blinding_key?: string;
}

export interface SwapData {
  swap_in_request?: string;
  swap_in_agreement?: string;
  swap_out_request?: SwapOutRequest;
  swap_out_agreement?: SwapOutAgreement;
  opening_tx_broadcasted?: OpeningTxBroadcasted;
  coop_close_message?: string;
  cancel_message_obj?: any;
  cancel_message?: string;
  peer_node_id?: string;
  initiator_node_id?: string;
  created_at?: number;
  role?: number;
  fsm_state?: string;
  private_key?: string;
  fee_preimage?: string;
  opening_tx_fee?: number;
  opening_tx_hex?: string;
  opening_block_height?: string;
  claim_tx_id?: string;
  claim_payment_hash?: string;
  claim_preimage?: string;
  blinding_key?: string;
  last_message?: string;
  next_message?: string;
  next_message_type?: number;
}

export interface ActiveSwap {
  swap_id?: string;
  data?: SwapData;
  type?: number;
  role?: number;
  previous?: string;
  current?: string;
}

export interface SwapRequest {
  node_id?: string;
  requests?: any[];
}

export interface Swap {
  id?: string;
  alias?: string;
  asset?: string;
  created_at?: string;
  type?: string;
  role?: string;
  state?: string;
  initiator_node_id?: string;
  peer_node_id?: string;
  amount?: number;
  channel_id?: string;
  opening_tx_id?: string;
  claim_tx_id?: string;
  cancel_message?: string;
}

export interface SwapChannel {
  short_channel_id?: string;
  local_balance?: number;
  remote_balance?: number;
  local_percentage?: number;
  state?: string;
}

export interface SwapPeerSentReceived {
  total_swaps_out?: number;
  total_swaps_in?: number;
  total_sats_swapped_out?: number;
  total_sats_swapped_in?: number;
}

export interface SwapPeer {
  nodeid?: string;
  alias?: string;
  swaps_allowed?: boolean;
  supported_assets?: string[];
  channels?: SwapChannel[];
  sent?: SwapPeerSentReceived;
  received?: SwapPeerSentReceived;
  total_fee_paid?: number;
}

export interface SwapPeerChannelsFlattened {
  nodeid?: string;
  alias?: string;
  swaps_allowed?: boolean;
  supported_assets?: string[];
  sent?: SwapPeerSentReceived;
  received?: SwapPeerSentReceived;
  total_fee_paid?: number;
  channels?: SwapChannel[];
  // Channels array flattened
  short_channel_id?: string;
  local_balance?: number;
  remote_balance?: number;
  local_percentage?: number;
  state?: string;
}
