import { VERSION } from './version';

export const API_URL = './api';

export const environment = {
  production: true,
  isDebugMode: false,
  AUTHENTICATE_API: API_URL + '/authenticate',
  BALANCE_API: API_URL + '/balance',
  FEES_API: API_URL + '/fees',
  PEERS_API: API_URL + '/peers',
  CHANNELS_API: API_URL + '/channels',
  CHANNELS_BACKUP_API: API_URL + '/channels/backup',
  GETINFO_API: API_URL + '/getinfo',
  WALLET_API: API_URL + '/wallet',
  NETWORK_API: API_URL + '/network',
  NEW_ADDRESS_API : API_URL + '/newaddress',
  TRANSACTIONS_API : API_URL + '/transactions',
  CONF_API: API_URL + '/conf',
  PAYREQUEST_API: API_URL + '/payreq',
  PAYMENTS_API: API_URL + '/payments',
  INVOICES_API: API_URL + '/invoices',
  SWITCH_API: API_URL + '/switch',
  VERSION: VERSION
};
