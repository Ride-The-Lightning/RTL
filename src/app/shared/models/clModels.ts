// export interface GetInfoAddress {
//   type?: string;
//   address?: string;
//   port?: number;
// }

// export interface GetInfo {
//   id?: string;
//   alias?: string;
//   color?: string;
//   num_peers?: number;
//   num_pending_channels?: number;
//   num_active_channels?: number;
//   num_inactive_channels?: number;
//   address?: GetInfoAddress[];
//   binding?: GetInfoAddress[];
//   version?: string;
//   blockheight?: number;
//   network?: string;
//   msatoshi_fees_collected?: number;
//   fees_collected_msat?: string;
// }

export interface GetInfoChain {
  chain?: string;
  network?: string;
}

export interface GetInfo {
	identity_pubkey?: string;
	alias?: string;
	num_pending_channels?: number;
	num_active_channels?: number;
	num_inactive_channels?: number;
	num_peers?: number;
	block_height?: number;
	synced_to_chain?: boolean;
	testnet?: boolean;
	chains?: GetInfoChain[];
  version?: string;
  currency_unit?: string;
  smaller_currency_unit?: string;
}
