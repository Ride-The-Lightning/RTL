export const VERSION = '0.12.0-beta';

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
  GETINFO_API: '/getinfo',
  WALLET_API: '/wallet',
  NETWORK_API: '/network',
  NEW_ADDRESS_API: '/newaddress',
  TRANSACTIONS_API: '/transactions',
  PAYMENTS_API: '/payments',
  INVOICES_API: '/invoices',
  SWITCH_API: '/switch',
  ON_CHAIN_API: '/onchain',
  MESSAGE_API: '/message',
  OFFERS_API: '/offers',
  LOOP_API: '/loop',
  BOLTZ_API: '/boltz',
  Web_SOCKET_API: '/ws'
};
