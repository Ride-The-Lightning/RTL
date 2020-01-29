export interface LoopTerms {
  min_swap_amount?: string;
  max_swap_amount?: string;
}

export interface LoopQuote {
  amount?: number;
  swap_fee?: string;
  miner_fee?: string;
  prepay_amt?: string;
  cltv_delta?: number;
  swap_payment_dest?: string;
}
