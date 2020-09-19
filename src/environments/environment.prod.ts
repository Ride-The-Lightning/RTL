import { VERSION } from './version';

export const API_URL = './api';

export const environment = {
  production: true,
  isDebugMode: false,
  AUTHENTICATE_API: API_URL + '/authenticate',
  CONF_API: API_URL + '/conf',
  BALANCE_API: '/balance',
  FEES_API: '/fees',
  PEERS_API: '/peers',
  CHANNELS_API: '/channels',
  CHANNELS_BACKUP_API: '/channels/backup',
  BOLTZ_SWAPS_API: '/boltz/',
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
  GET_NODES: 'getNodes',
  CREATE_SWAP: 'createswap'
}