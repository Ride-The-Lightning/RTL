export interface BoltzInfo {
  version: string;
  node?: string;
  network?: string;
  nodePubkey?: string;
  autoSwapStatus?: string;
  blockHeights?: any;
}

export interface ServiceInfo {
  fees?: {percentage?: number | null, miner: {normal?: number | null, reverse?: number | null}};
  limits?: {minimal?: number | null, maximal?: number | null};
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
  error?: string;
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
  error?: string;
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
  txId?: string;
}

export interface CreateReverseSwapRequest {
  amount?: number;
  address?: string;
  acceptZeroConf?: boolean;
}

export interface CreateReverseSwapResponse {
  id?: string;
  lockupAddress?: string;
  routingFeeMilliSat?: number;
  claimTransactionId?: string;
}
