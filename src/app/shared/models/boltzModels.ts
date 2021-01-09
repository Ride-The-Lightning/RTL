export interface ServiceInfo {
  fees?: {percentage?: number; miner: {normal?: number; reverse?: number;}};
  limits?: {minimal?: number; maximal?: number;};
}

export interface Swap {
  id?: string;
  status?: string;
  privateKey?: string;
  preimage?: string;
  redeemScript?: string;
  invoice?: string;
  lockupAddress?: string;
  expectedAmount?: string;
  timeoutBlockHeight?: number;
  lockupTransactionId?: string;
  refundTransactionId?: string;
}

export interface ChannelCreationInfo {
  swapId?: string;
  status?: string;
  inboundLiquidity?: number;
  private?: boolean;
  fundingTransactionId?: string;
  fundingTransactionVout?: number;
}

export interface ChannelCreation {
  swap?: Swap;
  channelCreation?: ChannelCreationInfo;
}

export interface ReverseSwap {
  id?: string;
  status?: string;
  privateKey?: string;
  preimage?: string;
  redeemScript?: string;
  invoice?: string;
  claimAddress?: string;
  onchainAmount?: string;
  timeoutBlockHeight?: number;
  lockupTransactionId?: string;
  claimTransactionId?: string;
}

export interface ListSwaps {
  swaps?: Swap[];
  channelCreations?: ChannelCreation[];
  reverseSwaps?: ReverseSwap[];
}

export interface CreateSwapRequest {
  amount?: number;
}

export interface CreateSwapResponse {
  id?: string;
  address?: string;
  expectedAmount?: string;
  bip21?: string;
}

export interface CreateReverseSwapRequest {
  amount?: number;
  address?: string;
  acceptZeroConf?: boolean
}

export interface CreateReverseSwapResponse {
  id?: string;
  lockupAddress?: string;
  routingFeeMilliSat?: number;
  claimTransactionId?: string;
}
