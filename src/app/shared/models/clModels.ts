export interface GetInfoAddress {
  type?: string;
  address?: string;
  port?: number;
}

export interface GetInfoCL {
  id?: string;
  alias?: string;
  color?: string;
  num_peers?: number;
  num_pending_channels?: number;
  num_active_channels?: number;
  num_inactive_channels?: number;
  address?: GetInfoAddress[];
  binding?: GetInfoAddress[];
  version?: string;
  blockheight?: number;
  network?: string;
  msatoshi_fees_collected?: number;
  fees_collected_msat?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
}

export interface FeesCL {
  feeCollected?: number;
  btc_feeCollected?: number;
}

export interface BalanceCL {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
  btc_totalBalance?: number;
  btc_confBalance?: number;
  btc_unconfBalance?: number;
}

export interface LocalRemoteBalanceCL {
  localBalance?: number;
  remoteBalance?: number;
  btc_localBalance?: number;
  btc_remoteBalance?: number;
}
