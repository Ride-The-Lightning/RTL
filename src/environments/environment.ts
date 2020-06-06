import { VERSION } from './version';

export const API_URL = 'http://localhost:3000/rtl/api';
export const BOLTZ_API_URL = 'https://testnet.boltz.exchange/api/';

export const environment = {
  production: false,
  isDebugMode: true,
  AUTHENTICATE_API: API_URL + '/authenticate',
  CONF_API: API_URL + '/conf',
  BALANCE_API: '/balance',
  FEES_API: '/fees',
  PEERS_API: '/peers',
  CHANNELS_API: '/channels',
  CHANNELS_BACKUP_API: '/channels/backup',
  BOLTZ_SWAPS_API: '/boltz',
  GETINFO_API: '/getinfo',
  WALLET_API: '/wallet',
  NETWORK_API: '/network',
  NEW_ADDRESS_API : '/newaddress',
  TRANSACTIONS_API : '/transactions',
  PAYREQUEST_API: '/payreq',
  PAYMENTS_API: '/payments',
  INVOICES_API: '/invoices',
  SWITCH_API: '/switch',
  ON_CHAIN_API: '/onchain',
  LOOP_API: '/loop',
  MESSAGE_API: '/message',
  VERSION: VERSION
};

export const boltzEnvironment = {
  GET_PAIRS: 'getPairs',
  CREATE_SWAP: 'createswap'
}