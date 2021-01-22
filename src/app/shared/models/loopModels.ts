import { LoopStateEnum, LoopTypeEnum } from '../services/consts-enums-functions';

export interface LoopTerms {
  min_swap_amount?: string;
  max_swap_amount?: string;
}

export interface LoopQuote {
  amount?: number;
  swap_fee_sat?: string;
  htlc_sweep_fee_sat?: string;
  htlc_publish_fee_sat?: string;
  prepay_amt_sat?: string;
  cltv_delta?: number;
  swap_payment_dest?: string;
  off_chain_swap_routing_fee_percentage?: number;
}

export interface LoopStatus {
  htlc_address?: string;
  id_bytes?: string;
  id?: string;
  error?: any;
}

export interface LoopSwapStatus {
  type?: LoopTypeEnum;
  cost_server?: string;
  cost_offchain?: string;
  htlc_address?: string;
  state?: LoopStateEnum;
  amt?: string;
  cost_onchain?: string;
  initiation_time?: string;
  initiation_time_str?: string;
  id_bytes?: string;
  last_update_time?: string;
  last_update_time_str?: string;
  id?: string;
}
