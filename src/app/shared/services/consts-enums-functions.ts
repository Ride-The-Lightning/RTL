/* eslint-disable max-len */
import { isDevMode } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CLNPageDefinitions, ECLPageDefinitions, LNDPageDefinitions, PageSettings } from '../models/pageSettings';
import { FiatCurrency } from '../models/rtlModels';
import { faBahtSign, faBrazilianRealSign, faDollarSign, faEuroSign, faFrancSign, faIndianRupeeSign, faRubleSign, faSterlingSign, faTurkishLiraSign, faWonSign, faYenSign } from '@fortawesome/free-solid-svg-icons';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}

export const HOUR_SECONDS = 3600;
export const SECS_IN_YEAR = 31536000;

export const DEFAULT_INVOICE_EXPIRY = HOUR_SECONDS * 24 * 7;

export const VERSION = '0.15.5-beta';

export const API_URL = isDevMode() ? 'http://localhost:3000/rtl/api' : './api';

export const API_END_POINTS = {
  AUTHENTICATE_API: API_URL + '/authenticate',
  CONF_API: API_URL + '/conf',
  PAGE_SETTINGS_API: API_URL + '/pagesettings',
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
  UTILITY_API: '/utility',
  LOOP_API: '/loop',
  BOLTZ_API: '/boltz',
  Web_SOCKET_API: '/ws'
};

export const CURRENCY_UNITS = ['Sats', 'BTC'];
export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2' };

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];
export const DATA_FILTER_RANGE_UNITS = ['HOURS', 'DAYS', 'MONTHS', 'YEARS'];

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export const ADDRESS_TYPES = [
  { addressId: '0', addressCode: 'bech32', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash' },
  { addressId: '1', addressCode: 'p2sh-segwit', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)' },
  { addressId: '4', addressCode: 'p2tr', addressTp: 'Taproot (P2TR)', addressDetails: 'Pay to taproot pubkey' }
];

export const TRANS_TYPES = [
  { id: '0', name: 'Priority (Default)' },
  { id: '1', name: 'Target Confirmation Blocks' },
  { id: '2', name: 'Fee' }
];

export const FEE_LIMIT_TYPES = [
  { id: 'none', name: 'No Fee Limit', placeholder: 'No Limit' },
  { id: 'fixed', name: 'Fixed Limit (Sats)', placeholder: 'Fixed Limit in Sats' },
  { id: 'percent', name: 'Percentage of Amount', placeholder: 'Percentage Limit' }
];

export const FEE_RATE_TYPES = [
  { feeRateId: 'urgent', feeRateType: 'Urgent' },
  { feeRateId: 'normal', feeRateType: 'Normal' },
  { feeRateId: 'slow', feeRateType: 'Slow' },
  { feeRateId: 'customperkb', feeRateType: 'Custom' }
];

export const NODE_SETTINGS = {
  themes: [
    { id: 'PURPLE', name: 'Diogo' },
    { id: 'TEAL', name: 'My2Sats' },
    { id: 'INDIGO', name: 'RTL' },
    { id: 'PINK', name: 'BK' },
    { id: 'YELLOW', name: 'Gold' }
  ],
  modes: [{ id: 'DAY', name: 'Day' }, { id: 'NIGHT', name: 'Night' }]
};

export enum ECLWSEventTypeEnum {
  PAYMENT_RECEIVED = 'payment-received',
  PAYMENT_RELAYED = 'payment-relayed',
  PAYMENT_SENT = 'payment-sent',
  PAYMENT_SETTLING_ONCHAIN = 'payment-settling-onchain',
  PAYMENT_FAILED = 'payment-failed',
  CHANNEL_OPENED = 'channel-opened',
  CHANNEL_STATE_CHANGED = 'channel-state-changed',
  CHANNEL_CLOSED = 'channel-closed'
}

export enum CLNWSEventTypeEnum {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  WARNING = 'warning',
  INVOICE_PAYMENT = 'invoice_payment',
  INVOICE_CREATION = 'invoice_creation',
  CHANNEL_OPENED = 'channel_opened',
  CHANNEL_STATE_CHANGED = 'channel_state_changed',
  SENDPAY_SUCCESS = 'sendpay_success',
  SENDPAY_FAILURE = 'sendpay_failure',
  COIN_MOVEMENT = 'coin_movement',
  BALANCE_SNAPSHOT = 'balance_snapshot',
  BLOCK_ADDED = 'block_added',
  OPENCHANNEL_PEER_SIGS = 'openchannel_peer_sigs',
  CHANNEL_OPEN_FAILED = 'channel_open_failed'
}

export enum LNDWSEventTypeEnum {
  INVOICE = 'invoice'
}

export enum UserPersonaEnum {
  OPERATOR = 'OPERATOR',
  MERCHANT = 'MERCHANT',
  ALL = 'ALL'
}

export enum AlertTypeEnum {
  INFORMATION = 'Information',
  WARNING = 'Warning',
  ERROR = 'Error',
  SUCCESS = 'Success',
  CONFIRM = 'Confirm'
}

export enum AuthenticateWith {
  JWT = 'JWT',
  PASSWORD = 'PASSWORD'
}

export enum TimeUnitEnum {
  SECS = 'SECS',
  MINS = 'MINS',
  HOURS = 'HOURS',
  DAYS = 'DAYS'
}

export enum DataFilterRangeEnum {
  HOURS = 'HOURS',
  DAYS = 'DAYS',
  MONTHS = 'MONTHS',
  YEARS = 'YEARS'
}

export enum CurrencyUnitEnum {
  SATS = 'Sats',
  BTC = 'BTC',
  OTHER = 'OTHER' // Fiat currency for conversion
}

export enum DataTypeEnum {
  ARRAY = 'ARRAY',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  BOOLEAN = 'BOOLEAN',
  PASSWORD = 'PASSWORD',
  DATE = 'DATE',
  DATE_TIME = 'DATE_TIME'
}

export enum ScreenSizeEnum {
  XS = 'XS', // < 600 => mobile handsets
  SM = 'SM', // 600 - 839 => tab portrait
  MD = 'MD', // 840 - 1239 => tab landscape & small laptops
  LG = 'LG', // 1240 - 1800 => small laptops
  XL = 'XL' // >1801 => big laptops
}

export const CHANNEL_CLOSURE_TYPE = {
  COOPERATIVE_CLOSE: { name: 'Co-operative Close', tooltip: 'Channel closed cooperatively' },
  LOCAL_FORCE_CLOSE: { name: 'Local Force Close', tooltip: 'Channel force-closed by the local node' },
  REMOTE_FORCE_CLOSE: { name: 'Remote Force Close', tooltip: 'Channel force-closed by the remote node' },
  BREACH_CLOSE: { name: 'Breach Close', tooltip: 'Remote node attempted to broadcast a prior revoked channel state' },
  FUNDING_CANCELED: { name: 'Funding Canceled', tooltip: 'Channel never fully opened' },
  ABANDONED: { name: 'Abandoned', tooltip: 'Channel abandoned by the local node' }
};

export const WALLET_ADDRESS_TYPE = {
  WITNESS_PUBKEY_HASH: { name: 'Witness Pubkey Hash', tooltip: '' },
  NESTED_PUBKEY_HASH: { name: 'Nested Pubkey Hash', tooltip: '' },
  UNUSED_WITNESS_PUBKEY_HASH: { name: 'Unused Witness Pubkey Hash', tooltip: '' },
  UNUSED_NESTED_PUBKEY_HASH: { name: 'Unused Nested Pubkey Hash', tooltip: '' },
  TAPROOT_PUBKEY: { name: 'Taproot Pubkey Hash', tooltip: '' }
};

export enum CLNFailReason {
  WIRE_INVALID_ONION_VERSION = 'Invalid Onion Version',
  WIRE_INVALID_ONION_HMAC = 'Invalid Onion HMAC',
  WIRE_INVALID_ONION_KEY = 'Invalid Onion Key',
  WIRE_TEMPORARY_CHANNEL_FAILURE = 'Temporary Channel Failure',
  WIRE_PERMANENT_CHANNEL_FAILURE = 'Permanent Channel Failure',
  WIRE_REQUIRED_CHANNEL_FEATURE_MISSING = 'Missing Required Channel Feature',
  WIRE_UNKNOWN_NEXT_PEER = 'Unknown Next Peer',
  WIRE_AMOUNT_BELOW_MINIMUM = 'Amount Below Minimum',
  WIRE_FEE_INSUFFICIENT = 'Insufficient Fee',
  WIRE_INCORRECT_CLTV_EXPIRY = 'Incorrect CLTV Expiry',
  WIRE_EXPIRY_TOO_FAR = 'Expiry Too Far',
  WIRE_EXPIRY_TOO_SOON = 'Expiry Too Soon',
  WIRE_CHANNEL_DISABLED = 'Channel Disabled',
  WIRE_INVALID_ONION_PAYLOAD = 'Invalid Onion Payload',
  WIRE_INVALID_REALM = 'Invalid Realm',
  WIRE_PERMANENT_NODE_FAILURE = 'Permanent Node Failure',
  WIRE_TEMPORARY_NODE_FAILURE = 'Temporary Node Failure',
  WIRE_REQUIRED_NODE_FEATURE_MISSING = 'Missing Required Node Feature',
  WIRE_INVALID_ONION_BLINDING = 'Invalid Onion Binding',
  WIRE_INCORRECT_OR_UNKNOWN_PAYMENT_DETAILS = 'Incorrect or Unknow Payment Details',
  WIRE_MPP_TIMEOUT = 'MPP Timeout',
  WIRE_FINAL_INCORRECT_CLTV_EXPIRY = 'Incorrect CLTV Expiry',
  WIRE_FINAL_INCORRECT_HTLC_AMOUNT = 'Incorrect HTLC Amount'
}

export enum CLNChannelPendingState {
  CHANNELD_NORMAL = 'Active',
  OPENINGD = 'Opening',
  CHANNELD_AWAITING_LOCKIN = 'Pending Open',
  CHANNELD_SHUTTING_DOWN = 'Shutting Down',
  CLOSINGD_SIGEXCHANGE = 'Closing: Sig Exchange',
  CLOSINGD_COMPLETE = 'Closed',
  AWAITING_UNILATERAL = 'Awaiting Unilateral Close',
  FUNDING_SPEND_SEEN = 'Funding Spend Seen',
  ONCHAIN = 'Onchain',
  DUALOPEND_OPEN_INIT = 'Dual Open Initialized',
  DUALOPEND_AWAITING_LOCKIN = 'Dual Pending Open'
}

export enum LoopStateEnum {
  INITIATED = 'Initiated',
  PREIMAGE_REVEALED = 'Preimage Revealed',
  HTLC_PUBLISHED = 'HTLC Published',
  SUCCESS = 'Successful',
  FAILED = 'Failed',
  INVOICE_SETTLED = 'Invoice Settled'
}

export enum LoopTypeEnum {
  LOOP_OUT = 'LOOP_OUT',
  LOOP_IN = 'LOOP_IN'
}

export enum SwapTypeEnum {
  SWAP_OUT = 'SWAP_OUT',
  SWAP_IN = 'SWAP_IN'
}

export enum SwapStateEnum {
  'swap.created' = 'Swap Created',
  'swap.expired' = 'Swap Expired',
  'invoice.set' = 'Invoice Set',
  'invoice.paid' = 'Invoice Paid',
  'invoice.pending' = 'Invoice Pending',
  'invoice.settled' = 'Invoice Settled',
  'invoice.failedToPay' = 'Invoice Failed To Pay',
  'channel.created' = 'Channel Created',
  'transaction.failed' = 'Transaction Failed',
  'transaction.mempool' = 'Transaction Mempool',
  'transaction.claimed' = 'Transaction Claimed',
  'transaction.refunded' = 'Transaction Refunded',
  'transaction.confirmed' = 'Transaction Confirmed',
  'transaction.lockupFailed' = 'Lockup Transaction Failed',
  'swap.refunded' = 'Swap Refunded',
  'swap.abandoned' = 'Swap Abandoned'
}

export const MONTHS = [
  { name: 'Jan', days: 31 },
  { name: 'Feb', days: 28 },
  { name: 'Mar', days: 31 },
  { name: 'Apr', days: 30 },
  { name: 'May', days: 31 },
  { name: 'Jun', days: 30 },
  { name: 'Jul', days: 31 },
  { name: 'Aug', days: 31 },
  { name: 'Sep', days: 30 },
  { name: 'Oct', days: 31 },
  { name: 'Nov', days: 30 },
  { name: 'Dec', days: 31 }
];

export const SCROLL_RANGES = ['MONTHLY', 'YEARLY'];

export enum ServicesEnum {
  LOOP = 'LOOP',
  BOLTZ = 'BOLTZ',
  OFFERS = 'OFFERS',
  PEERSWAP = 'PEERSWAP'
}

export const PASSWORD_BLACKLIST = ['password', 'changeme', 'moneyprintergobrrr'];

export enum APICallStatusEnum {
  UN_INITIATED = 'UN_INITIATED',
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export const UI_MESSAGES = {
  NO_SPINNER: 'No Spinner...',
  GET_NODE_INFO: 'Getting Node Information...',
  INITALIZE_NODE_DATA: 'Initializing Node Data...',
  GENERATE_NEW_ADDRESS: 'Getting New Address...',
  SEND_FUNDS: 'Sending Funds...',
  UPDATE_CHAN_POLICY: 'Updating Channel Policy...',
  GET_CHAN_POLICY: 'Fetching Channel Policy...',
  GET_REMOTE_POLICY: 'Fetching Remote Policy...',
  CLOSE_CHANNEL: 'Closing Channel...',
  FORCE_CLOSE_CHANNEL: 'Force Closing Channel...',
  OPEN_CHANNEL: 'Opening Channel...',
  CONNECT_PEER: 'Connecting Peer...',
  DISCONNECT_PEER: 'Disconnecting Peer...',
  ADD_INVOICE: 'Adding Invoice...',
  CREATE_INVOICE: 'Creating Invoice...',
  DELETE_INVOICE: 'Deleting Invoices...',
  DECODE_PAYMENT: 'Decoding Payment...',
  DECODE_OFFER: 'Decoding Offer...',
  DECODE_PAYMENTS: 'Decoding Payments...',
  FETCH_INVOICE: 'Fetching Invoice...',
  GET_SENT_PAYMENTS: 'Getting Sent Payments...',
  SEND_PAYMENT: 'Sending Payment...',
  SEND_KEYSEND: 'Sending Keysend Payment...',
  SEARCHING_NODE: 'Searching Node...',
  SEARCHING_CHANNEL: 'Searching Channel...',
  SEARCHING_INVOICE: 'Searching Invoice...',
  SEARCHING_PAYMENT: 'Searching Payment...',
  BACKUP_CHANNEL: 'Backup Channels...',
  VERIFY_CHANNEL: 'Verify Channel...',
  DOWNLOAD_BACKUP_FILE: 'Downloading Backup File...',
  RESTORE_CHANNEL: 'Restoring Channels...',
  GET_TERMS_QUOTES: 'Getting Terms and Quotes...',
  LABEL_UTXO: 'Labelling UTXO...',
  GET_NODE_ADDRESS: 'Getting Node Address...',
  GEN_SEED: 'Generating Seed...',
  INITIALIZE_WALLET: 'Initializing Wallet...',
  UNLOCK_WALLET: 'Unlocking Wallet...',
  WAIT_SYNC_NODE: 'Waiting for Node Sync...',
  UPDATE_BOLTZ_SETTINGS: 'Updating Boltz Service Settings...',
  UPDATE_LOOP_SETTINGS: 'Updating Loop Service Settings...',
  UPDATE_PEERSWAP_SETTINGS: 'Updating Peerswap Service Settings...',
  UPDATE_SETTING: 'Updating Setting...',
  UPDATE_APPLICATION_SETTINGS: 'Updating Application Settings...',
  UPDATE_NODE_SETTINGS: 'Updating Node Settings...',
  UPDATE_SELECTED_NODE: 'Updating Selected Node...',
  OPEN_CONFIG_FILE: 'Opening Config File...',
  GET_BOLTZ_INFO: 'Getting Boltz Info...',
  GET_SERVICE_INFO: 'Getting Service Info...',
  GET_QUOTE: 'Getting Quotes...',
  UPDATE_DEFAULT_NODE_SETTING: 'Updating Defaule Node Settings...',
  GET_BOLTZ_SWAPS: 'Getting Boltz Swaps...',
  SIGN_MESSAGE: 'Signing Message...',
  VERIFY_MESSAGE: 'Verifying Message...',
  BUMP_FEE: 'Bumping Fee...',
  LEASE_UTXO: 'Leasing UTXO...',
  GET_LOOP_INFO: 'Getting Loop Info...',
  GET_LOOP_SWAPS: 'Getting List Swaps...',
  GET_FORWARDING_HISTORY: 'Getting Forwarding History...',
  GET_LOOKUP_DETAILS: 'Getting Lookup Details...',
  GET_RTL_CONFIG: 'Getting RTL Config...',
  VERIFY_TOKEN: 'Verify Token...',
  DISABLE_OFFER: 'Disabling Offer...',
  CREATE_OFFER: 'Creating Offer...',
  DELETE_OFFER_BOOKMARK: 'Deleting Bookmark...',
  GET_FUNDER_POLICY: 'Getting Or Updating Funder Policy...',
  GET_LIST_CONFIGS: 'Getting Configurations List...',
  LIST_NETWORK_NODES: 'Getting Network Nodes List...',
  GET_PAGE_SETTINGS: 'Getting Page Settings...',
  SET_PAGE_SETTINGS: 'Setting Page Settings...',
  UPDATE_PAGE_SETTINGS: 'Updating Page Layout...',
  REBALANCE_CHANNEL: 'Rebalancing Channel...',
  LOG_OUT: 'Logging Out...'
};

export enum PaymentTypes {
  INVOICE = 'INVOICE',
  OFFER = 'OFFER',
  KEYSEND = 'KEYSEND'
}

export enum ReportBy {
  FEES = 'FEES',
  EVENTS = 'EVENTS'
}

export enum RTLActions {
  VOID = 'VOID',
  SET_API_URL_ECL = 'SET_API_URL_ECL',
  UPDATE_API_CALL_STATUS_ROOT = 'UPDATE_API_CALL_STATUS_ROOT',
  RESET_ROOT_STORE = 'RESET_ROOT_STORE',
  CLOSE_ALL_DIALOGS = 'CLOSE_ALL_DIALOGS',
  OPEN_SNACK_BAR = 'OPEN_SNACKBAR',
  OPEN_SPINNER = 'OPEN_SPINNER',
  CLOSE_SPINNER = 'CLOSE_SPINNER',
  OPEN_ALERT = 'OPEN_ALERT',
  CLOSE_ALERT = 'CLOSE_ALERT',
  OPEN_CONFIRMATION = 'OPEN_CONFIRMATION',
  CLOSE_CONFIRMATION = 'CLOSE_CONFIRMATION',
  SHOW_PUBKEY = 'SHOW_PUBKEY',
  FETCH_CONFIG = 'FETCH_CONFIG',
  SHOW_CONFIG = 'SHOW_CONFIG',
  FETCH_STORE = 'FETCH_STORE',
  SET_STORE = 'SET_STORE',
  FETCH_APPLICATION_SETTINGS = 'FETCH_APPLICATION_SETTINGS',
  SET_APPLICATION_SETTINGS = 'SET_APPLICATION_SETTINGS',
  SAVE_SETTINGS = 'SAVE_SETTINGS',
  SET_SELECTED_NODE = 'SET_SELECTED_NODE',
  UPDATE_ROOT_NODE_SETTINGS = 'UPDATE_ROOT_NODE_SETTINGS',
  UPDATE_APPLICATION_SETTINGS = 'UPDATE_APPLICATION_SETTINGS',
  UPDATE_NODE_SETTINGS = 'UPDATE_NODE_SETTINGS',
  SET_SELECTED_NODE_SETTINGS = 'SET_SELECTED_NODE_SETTINGS',
  SET_NODE_DATA = 'SET_NODE_DATA',
  IS_AUTHORIZED = 'IS_AUTHORIZED',
  IS_AUTHORIZED_RES = 'IS_AUTHORIZED_RES',
  LOGIN = 'LOGIN',
  VERIFY_TWO_FA = 'VERIFY_TWO_FA',
  LOGOUT = 'LOGOUT',
  RESET_PASSWORD = 'RESET_PASSWORD',
  RESET_PASSWORD_RES = 'RESET_PASSWORD_RES',
  FETCH_FILE = 'FETCH_FILE',
  SHOW_FILE = 'SHOW_FILE'
};

export enum LNDActions {
  RESET_LND_STORE = 'RESET_LND_STORE',
  UPDATE_API_CALL_STATUS_LND = 'UPDATE_API_CALL_STATUS_LND',
  SET_CHILD_NODE_SETTINGS_LND = 'SET_CHILD_NODE_SETTINGS_LND',
  UPDATE_SELECTED_NODE_OPTIONS = 'UPDATE_SELECTED_NODE_OPTIONS',
  FETCH_PAGE_SETTINGS_LND = 'FETCH_PAGE_SETTINGS_LND',
  SET_PAGE_SETTINGS_LND = 'SET_PAGE_SETTINGS_LND',
  SAVE_PAGE_SETTINGS_LND = 'SAVE_PAGE_SETTINGS_LND',
  FETCH_INFO_LND = 'FETCH_INFO_LND',
  SET_INFO_LND = 'SET_INFO_LND',
  FETCH_PEERS_LND = 'FETCH_PEERS_LND',
  SET_PEERS_LND = 'SET_PEERS_LND',
  SAVE_NEW_PEER_LND = 'SAVE_NEW_PEER_LND',
  NEWLY_ADDED_PEER_LND = 'NEWLY_ADDED_PEER_LND',
  DETACH_PEER_LND = 'DETACH_PEER_LND',
  REMOVE_PEER_LND = 'REMOVE_PEER_LND',
  SAVE_NEW_INVOICE_LND = 'SAVE_NEW_INVOICE_LND',
  NEWLY_SAVED_INVOICE_LND = 'NEWLY_SAVED_INVOICE_LND',
  ADD_INVOICE_LND = 'ADD_INVOICE_LND',
  FETCH_FEES_LND = 'FETCH_FEES_LND',
  SET_FEES_LND = 'SET_FEES_LND',
  FETCH_BLOCKCHAIN_BALANCE_LND = 'FETCH_BLOCKCHAIN_BALANCE_LND',
  SET_BLOCKCHAIN_BALANCE_LND = 'SET_BLOCKCHAIN_BALANCE_LND',
  FETCH_NETWORK_LND = 'FETCH_NETWORK_LND',
  SET_NETWORK_LND = 'SET_NETWORK_LND',
  FETCH_CHANNELS_LND = 'FETCH_CHANNELS_LND',
  FETCH_PENDING_CHANNELS_LND = 'FETCH_PENDING_CHANNELS_LND',
  FETCH_CLOSED_CHANNELS_LND = 'FETCH_CLOSED_CHANNELS_LND',
  SET_CHANNELS_LND = 'SET_CHANNELS_LND',
  SET_PENDING_CHANNELS_LND = 'SET_PENDING_CHANNELS_LND',
  SET_CLOSED_CHANNELS_LND = 'SET_CLOSED_CHANNELS_LND',
  UPDATE_CHANNEL_LND = 'UPDATE_CHANNEL_LND',
  SAVE_NEW_CHANNEL_LND = 'SAVE_NEW_CHANNEL_LND',
  CLOSE_CHANNEL_LND = 'CLOSE_CHANNEL_LND',
  REMOVE_CHANNEL_LND = 'REMOVE_CHANNEL_LND',
  BACKUP_CHANNELS_LND = 'BACKUP_CHANNELS_LND',
  VERIFY_CHANNEL_LND = 'VERIFY_CHANNEL_LND',
  BACKUP_CHANNELS_RES_LND = 'BACKUP_CHANNELS_RES_LND',
  VERIFY_CHANNEL_RES_LND = 'VERIFY_CHANNEL_RES_LND',
  RESTORE_CHANNELS_LIST_LND = 'RESTORE_CHANNELS_LIST_LND',
  SET_RESTORE_CHANNELS_LIST_LND = 'SET_RESTORE_CHANNELS_LIST_LND',
  RESTORE_CHANNELS_LND = 'RESTORE_CHANNELS_LND',
  RESTORE_CHANNELS_RES_LND = 'RESTORE_CHANNELS_RES_LND',
  FETCH_INVOICES_LND = 'FETCH_INVOICES_LND',
  SET_INVOICES_LND = 'SET_INVOICES_LND',
  UPDATE_INVOICE_LND = 'UPDATE_INVOICE_LND',
  UPDATE_PAYMENT_LND = 'UPDATE_PAYMENT_LND',
  SET_TOTAL_INVOICES_LND = 'SET_TOTAL_INVOICES_LND',
  FETCH_TRANSACTIONS_LND = 'FETCH_TRANSACTIONS_LND',
  SET_TRANSACTIONS_LND = 'SET_TRANSACTIONS_LND',
  FETCH_UTXOS_LND = 'FETCH_UTXOS_LND',
  SET_UTXOS_LND = 'SET_UTXOS_LND',
  FETCH_PAYMENTS_LND = 'FETCH_PAYMENTS_LND',
  SET_PAYMENTS_LND = 'SET_PAYMENTS_LND',
  SEND_PAYMENT_LND = 'SEND_PAYMENT_LND',
  SEND_PAYMENT_STATUS_LND = 'SEND_PAYMENT_STATUS_LND',
  FETCH_GRAPH_NODE_LND = 'FETCH_GRAPH_NODE_LND',
  SET_GRAPH_NODE_LND = 'SET_GRAPH_NODE_LND',
  GET_NEW_ADDRESS_LND = 'GET_NEW_ADDRESS_LND',
  SET_NEW_ADDRESS_LND = 'SET_NEW_ADDRESS_LND',
  SET_CHANNEL_TRANSACTION_LND = 'SET_CHANNEL_TRANSACTION_LND',
  SET_CHANNEL_TRANSACTION_RES_LND = 'SET_CHANNEL_TRANSACTION_RES_LND',
  GEN_SEED_LND = 'GEN_SEED_LND',
  GEN_SEED_RESPONSE_LND = 'GEN_SEED_RESPONSE_LND',
  INIT_WALLET_LND = 'INIT_WALLET_LND',
  INIT_WALLET_RESPONSE_LND = 'INIT_WALLET_RESPONSE_LND',
  UNLOCK_WALLET_LND = 'UNLOCK_WALLET_LND',
  PEER_LOOKUP_LND = 'PEER_LOOKUP_LND',
  CHANNEL_LOOKUP_LND = 'CHANNEL_LOOKUP_LND',
  INVOICE_LOOKUP_LND = 'INVOICE_LOOKUP_LND',
  PAYMENT_LOOKUP_LND = 'PAYMENT_LOOKUP_LND',
  SET_LOOKUP_LND = 'SET_LOOKUP_LND',
  GET_FORWARDING_HISTORY_LND = 'GET_FORWARDING_HISTORY_LND',
  SET_FORWARDING_HISTORY_LND = 'SET_FORWARDING_HISTORY_LND',
  GET_QUERY_ROUTES_LND = 'GET_QUERY_ROUTES_LND',
  SET_QUERY_ROUTES_LND = 'SET_QUERY_ROUTES_LND',
  GET_ALL_LIGHTNING_TRANSATIONS_LND = 'GET_ALL_LIGHTNING_TRANSATIONS_LND',
  SET_ALL_LIGHTNING_TRANSATIONS_LND = 'SET_ALL_LIGHTNING_TRANSATIONS_LND'
};

export enum CLNActions {
  RESET_CLN_STORE = 'RESET_CLN_STORE',
  UPDATE_API_CALL_STATUS_CLN = 'UPDATE_API_CALL_STATUS_CLN',
  SET_CHILD_NODE_SETTINGS_CLN = 'SET_CHILD_NODE_SETTINGS_CLN',
  FETCH_PAGE_SETTINGS_CLN = 'FETCH_PAGE_SETTINGS_CLN',
  SET_PAGE_SETTINGS_CLN = 'SET_PAGE_SETTINGS_CLN',
  SAVE_PAGE_SETTINGS_CLN = 'SAVE_PAGE_SETTINGS_CLN',
  FETCH_INFO_CLN = 'FETCH_INFO_CL_CLN',
  SET_INFO_CLN = 'SET_INFO_CLN',
  FETCH_FEES_CLN = 'FETCH_FEES_CLN',
  SET_FEES_CLN = 'SET_FEES_CLN',
  FETCH_FEE_RATES_CLN = 'FETCH_FEE_RATES_CLN',
  SET_FEE_RATES_CLN = 'SET_FEE_RATES_CLN',
  GET_NEW_ADDRESS_CLN = 'GET_NEW_ADDRESS_CLN',
  SET_NEW_ADDRESS_CLN = 'SET_NEW_ADDRESS_CLN',
  FETCH_UTXO_BALANCES_CLN = 'FETCH_UTXO_BALANCES_CLN',
  SET_UTXO_BALANCES_CLN = 'SET_UTXO_BALANCES_CLN',
  FETCH_PEERS_CLN = 'FETCH_PEERS_CLN',
  SET_PEERS_CLN = 'SET_PEERS_CLN',
  SAVE_NEW_PEER_CLN = 'SAVE_NEW_PEER_CLN',
  NEWLY_ADDED_PEER_CLN = 'NEWLY_ADDED_PEER_CLN',
  ADD_PEER_CLN = 'ADD_PEER_CLN',
  DETACH_PEER_CLN = 'DETACH_PEER_CLN',
  REMOVE_PEER_CLN = 'REMOVE_PEER_CLN',
  FETCH_CHANNELS_CLN = 'FETCH_CHANNELS_CLN',
  SET_CHANNELS_CLN = 'SET_CHANNELS_CLN',
  UPDATE_CHANNEL_CLN = 'UPDATE_CHANNEL_CLN',
  SAVE_NEW_CHANNEL_CLN = 'SAVE_NEW_CHANNEL_CLN',
  CLOSE_CHANNEL_CLN = 'CLOSE_CHANNEL_CLN',
  REMOVE_CHANNEL_CLN = 'REMOVE_CHANNEL_CLN',
  FETCH_PAYMENTS_CLN = 'FETCH_PAYMENTS_CLN',
  SET_PAYMENTS_CLN = 'SET_PAYMENTS_CLN',
  SEND_PAYMENT_CLN = 'SEND_PAYMENT_CLN',
  SEND_PAYMENT_STATUS_CLN = 'SEND_PAYMENT_STATUS_CLN',
  GET_QUERY_ROUTES_CLN = 'GET_QUERY_ROUTES_CLN',
  SET_QUERY_ROUTES_CLN = 'SET_QUERY_ROUTES_CLN',
  PEER_LOOKUP_CLN = 'PEER_LOOKUP_CLN',
  CHANNEL_LOOKUP_CLN = 'CHANNEL_LOOKUP_CLN',
  INVOICE_LOOKUP_CLN = 'INVOICE_LOOKUP_CLN',
  SET_LOOKUP_CLN = 'SET_LOOKUP_CLN',
  GET_FORWARDING_HISTORY_CLN = 'GET_FORWARDING_HISTORY_CLN',
  SET_FORWARDING_HISTORY_CLN = 'SET_FORWARDING_HISTORY_CLN',
  GET_FAILED_FORWARDING_HISTORY_CLN = 'GET_FAILED_FORWARDING_HISTORY_CLN',
  SET_FAILED_FORWARDING_HISTORY_CLN = 'SET_FAILED_FORWARDING_HISTORY_CLN',
  GET_LOCAL_FAILED_FORWARDING_HISTORY_CLN = 'GET_LOCAL_FAILED_FORWARDING_HISTORY_CLN',
  SET_LOCAL_FAILED_FORWARDING_HISTORY_CLN = 'SET_LOCAL_FAILED_FORWARDING_HISTORY_CLN',
  FETCH_INVOICES_CLN = 'FETCH_INVOICES_CLN',
  SET_INVOICES_CLN = 'SET_INVOICES_CLN',
  SAVE_NEW_INVOICE_CLN = 'SAVE_NEW_INVOICE_CLN',
  ADD_INVOICE_CLN = 'ADD_INVOICE_CLN',
  UPDATE_INVOICE_CLN = 'UPDATE_INVOICE_CLN',
  DELETE_EXPIRED_INVOICE_CLN = 'DELETE_EXPIRED_INVOICE_CLN',
  SET_CHANNEL_TRANSACTION_CLN = 'SET_CHANNEL_TRANSACTION_CLN',
  SET_CHANNEL_TRANSACTION_RES_CLN = 'SET_CHANNEL_TRANSACTION_RES_CLN',
  FETCH_OFFER_INVOICE_CLN = 'FETCH_OFFER_INVOICE_CLN',
  SET_OFFER_INVOICE_CLN = 'SET_OFFER_INVOICE_CLN',
  FETCH_OFFERS_CLN = 'FETCH_OFFERS_CLN',
  SET_OFFERS_CLN = 'SET_OFFERS_CLN',
  SAVE_NEW_OFFER_CLN = 'SAVE_NEW_OFFER_CLN',
  ADD_OFFER_CLN = 'ADD_OFFER_CLN',
  DISABLE_OFFER_CLN = 'DISABLE_OFFER_CLN',
  UPDATE_OFFER_CLN = 'UPDATE_OFFER_CLN',
  FETCH_OFFER_BOOKMARKS_CLN = 'FETCH_OFFER_BOOKMARKS_CLN',
  SET_OFFER_BOOKMARKS_CLN = 'SET_OFFER_BOOKMARKS_CLN',
  ADD_UPDATE_OFFER_BOOKMARK_CLN = 'ADD_UPDATE_OFFER_BOOKMARK_CLN',
  DELETE_OFFER_BOOKMARK_CLN = 'DELETE_OFFER_BOOKMARK_CLN',
  REMOVE_OFFER_BOOKMARK_CLN = 'REMOVE_OFFER_BOOKMARK_CL'
};

export enum ECLActions {
  RESET_ECL_STORE = 'RESET_ECL_STORE',
  UPDATE_API_CALL_STATUS_ECL = 'UPDATE_API_CALL_STATUS_ECL',
  SET_CHILD_NODE_SETTINGS_ECL = 'SET_CHILD_NODE_SETTINGS_ECL',
  FETCH_PAGE_SETTINGS_ECL = 'FETCH_PAGE_SETTINGS_ECL',
  SET_PAGE_SETTINGS_ECL = 'SET_PAGE_SETTINGS_ECL',
  SAVE_PAGE_SETTINGS_ECL = 'SAVE_PAGE_SETTINGS_ECL',
  FETCH_INFO_ECL = 'FETCH_INFO_ECL',
  SET_INFO_ECL = 'SET_INFO_ECL',
  FETCH_FEES_ECL = 'FETCH_FEES_ECL',
  SET_FEES_ECL = 'SET_FEES_ECL',
  FETCH_CHANNELS_ECL = 'FETCH_CHANNELS_ECL',
  SET_ACTIVE_CHANNELS_ECL = 'SET_ACTIVE_CHANNELS_ECL',
  SET_PENDING_CHANNELS_ECL = 'SET_PENDING_CHANNELS_ECL',
  SET_INACTIVE_CHANNELS_ECL = 'SET_INACTIVE_CHANNELS_ECL',
  FETCH_ONCHAIN_BALANCE_ECL = 'FETCH_ONCHAIN_BALANCE_ECL',
  SET_ONCHAIN_BALANCE_ECL = 'SET_ONCHAIN_BALANCE_ECL',
  FETCH_LIGHTNING_BALANCE_ECL = 'FETCH_LIGHTNING_BALANCE_ECL',
  SET_LIGHTNING_BALANCE_ECL = 'SET_LIGHTNING_BALANCE_ECL',
  SET_CHANNELS_STATUS_ECL = 'SET_CHANNELS_STATUS_ECL',
  FETCH_PEERS_ECL = 'FETCH_PEERS_ECL',
  SET_PEERS_ECL = 'SET_PEERS_ECL',
  SAVE_NEW_PEER_ECL = 'SAVE_NEW_PEER_ECL',
  NEWLY_ADDED_PEER_ECL = 'NEWLY_ADDED_PEER_ECL',
  ADD_PEER_ECL = 'ADD_PEER_ECL',
  DETACH_PEER_ECL = 'DETACH_PEER_ECL',
  REMOVE_PEER_ECL = 'REMOVE_PEER_ECL',
  GET_NEW_ADDRESS_ECL = 'GET_NEW_ADDRESS_ECL',
  SET_NEW_ADDRESS_ECL = 'SET_NEW_ADDRESS_ECL',
  SAVE_NEW_CHANNEL_ECL = 'SAVE_NEW_CHANNEL_ECL',
  UPDATE_CHANNEL_ECL = 'UPDATE_CHANNEL_ECL',
  CLOSE_CHANNEL_ECL = 'CLOSE_CHANNEL_ECL',
  REMOVE_CHANNEL_ECL = 'REMOVE_CHANNEL_ECL',
  FETCH_PAYMENTS_ECL = 'FETCH_PAYMENTS_ECL',
  SET_PAYMENTS_ECL = 'SET_PAYMENTS_ECL',
  GET_QUERY_ROUTES_ECL = 'GET_QUERY_ROUTES_ECL',
  SET_QUERY_ROUTES_ECL = 'SET_QUERY_ROUTES_ECL',
  SEND_PAYMENT_ECL = 'SEND_PAYMENT_ECL',
  SEND_PAYMENT_STATUS_ECL = 'SEND_PAYMENT_STATUS_ECL',
  FETCH_TRANSACTIONS_ECL = 'FETCH_TRANSACTIONS_ECL',
  SET_TRANSACTIONS_ECL = 'SET_TRANSACTIONS_ECL',
  SEND_ONCHAIN_FUNDS_ECL = 'SEND_ONCHAIN_FUNDS_ECL',
  SEND_ONCHAIN_FUNDS_RES_ECL = 'SEND_ONCHAIN_FUNDS_RES_ECL',
  FETCH_INVOICES_ECL = 'FETCH_INVOICES_ECL',
  SET_INVOICES_ECL = 'SET_INVOICES_ECL',
  SET_TOTAL_INVOICES_ECL = 'SET_TOTAL_INVOICES_ECL',
  CREATE_INVOICE_ECL = 'CREATE_INVOICE_ECL',
  ADD_INVOICE_ECL = 'ADD_INVOICE_ECL',
  UPDATE_INVOICE_ECL = 'UPDATE_INVOICE_ECL',
  PEER_LOOKUP_ECL = 'PEER_LOOKUP_ECL',
  INVOICE_LOOKUP_ECL = 'INVOICE_LOOKUP_ECL',
  SET_LOOKUP_ECL = 'SET_LOOKUP_ECL',
  UPDATE_CHANNEL_STATE_ECL = 'UPDATE_CHANNEL_STATE_ECL',
  UPDATE_RELAYED_PAYMENT_ECL = 'UPDATE_RELAYED_PAYMENT_ECL'
};

export const NODE_FEATURES_CLN = [
  { range: { min: 0, max: 1 }, description: 'Requires or supports extra channel re-establish fields' },
  { range: { min: 4, max: 5 }, description: 'Commits to a shutdown script pubkey when opening channel' },
  { range: { min: 6, max: 7 }, description: 'More sophisticated gossip control' },
  { range: { min: 8, max: 9 }, description: 'Requires/supports variable-length routing onion payloads' },
  { range: { min: 10, max: 11 }, description: 'Gossip queries can include additional information' },
  { range: { min: 12, max: 13 }, description: 'Static key for remote output' },
  { range: { min: 14, max: 15 }, description: 'Node supports payment secret field' },
  { range: { min: 16, max: 17 }, description: 'Node can receive basic multi-part payments' },
  { range: { min: 18, max: 19 }, description: 'Node can create large channels' },
  { range: { min: 20, max: 21 }, description: 'Anchor outputs' },
  { range: { min: 22, max: 23 }, description: 'Anchor commitment type with zero fee HTLC transactions' },
  { range: { min: 26, max: 27 }, description: 'Future segwit versions allowed in shutdown' },
  { range: { min: 30, max: 31 }, description: 'AMP support' },
  { range: { min: 44, max: 45 }, description: 'Explicit commitment type' }
];

export enum NodeFeaturesECL {
  gossip_queries_ex = 'Gossip queries including additional information',
  option_anchor_outputs = 'Anchor outputs',
  option_data_loss_protect = 'Extra channel re-establish fields',
  var_onion_optin = 'Variable-length routing onion payloads',
  option_static_remotekey = 'Static key for remote output',
  option_support_large_channel = 'Create large channels',
  option_anchors_zero_fee_htlc_tx = 'Anchor commitment type with zero fee HTLC transactions',
  payment_secret = 'Payment secret field',
  option_shutdown_anysegwit = 'Future segwit versions allowed in shutdown',
  basic_mpp = 'Basic multi-part payments',
  gossip_queries = 'More sophisticated gossip control',
  option_upfront_shutdown_script = 'Shutdown script pubkey when opening channel',
  anchors_zero_fee_htlc_tx = 'Anchor commitment type with zero fee HTLC transactions',
  amp = 'AMP'
};

export enum NodeFeaturesLND {
  'data-loss-protect' = 'Extra channel re-establish fields',
  'upfront-shutdown-script' = 'Shutdown script pubkey when opening channel',
  'gossip-queries' = 'More sophisticated gossip control',
  'tlv-onion' = 'Variable-length routing onion payloads',
  'ext-gossip-queries' = 'Gossip queries can include additional information',
  'static-remote-key' = 'Static key for remote output',
  'payment-addr' = 'Payment secret field',
  'multi-path-payments' = 'Basic multi-part payments',
  'wumbo-channels' = 'Wumbo Channels',
  'anchors' = 'Anchor outputs',
  'anchors-zero-fee-htlc-tx' = 'Anchor commitment type with zero fee HTLC transactions',
  'amp' = 'AMP'
};

export const LADS_POLICY = [
  { id: 'match', placeholder: 'Policy Match (%age)', min: 0, max: 200 },
  { id: 'available', placeholder: 'Policy Available (%age)', min: 0, max: 100 },
  { id: 'fixed', placeholder: 'Fixed Policy (Sats)', min: 0, max: 100 }
];

export enum CLNForwardingEventsStatusEnum {
  OFFERED = 'offered',
  SETTLED = 'settled',
  FAILED = 'failed',
  LOCAL_FAILED = 'local_failed'
}

export enum PeerswapTypes {
  SWAP_OUT = 'swap-out',
  SWAP_IN = 'swap-in'
}

export enum PeerswapRoles {
  SENDER = 'sender',
  RECEIVER = 'receiver'
}

export enum PeerswapStates {
  SWAP_CANCELED = 'State_SwapCanceled'
}

export enum PeerswapPeersLists {
  ALLOWED = 'allowed',
  SUSPICIOUS = 'suspicious'
}

export enum SortOrderEnum {
  ASCENDING = 'asc',
  DESCENDING = 'desc'
}

export const SORT_ORDERS = ['asc', 'desc'];

export const CLN_DEFAULT_PAGE_SETTINGS: PageSettings[] = [
  { pageId: 'on_chain', tables: [
    { tableId: 'utxos', recordsPerPage: PAGE_SIZE, sortBy: 'blockheight', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['txid', 'value'],
      columnSelection: ['txid', 'output', 'value', 'blockheight'] },
    { tableId: 'dust_utxos', recordsPerPage: PAGE_SIZE, sortBy: 'blockheight', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['txid', 'value'],
      columnSelection: ['txid', 'output', 'value', 'blockheight'] }
  ] },
  { pageId: 'peers_channels', tables: [
    { tableId: 'open_channels', recordsPerPage: PAGE_SIZE, sortBy: 'msatoshi_to_us', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'msatoshi_to_us', 'msatoshi_to_them'],
      columnSelection: ['short_channel_id', 'alias', 'msatoshi_to_us', 'msatoshi_to_them', 'balancedness'] },
    { tableId: 'pending_inactive_channels', recordsPerPage: PAGE_SIZE, sortBy: 'state', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'state'],
      columnSelection: ['alias', 'connected', 'state', 'msatoshi_total'] },
    { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.ASCENDING,
      columnSelectionSM: ['alias', 'id'],
      columnSelection: ['alias', 'id', 'netaddr'] },
    { tableId: 'active_HTLCs', recordsPerPage: PAGE_SIZE, sortBy: 'expiry', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['amount_msat', 'direction', 'expiry'],
      columnSelection: ['amount_msat', 'direction', 'expiry', 'state'] }
  ] },
  { pageId: 'liquidity_ads', tables: [
    { tableId: 'liquidity_ads', recordsPerPage: PAGE_SIZE, sortBy: 'channel_opening_fee', sortOrder: SortOrderEnum.ASCENDING,
      columnSelectionSM: ['alias', 'channel_opening_fee'],
      columnSelection: ['alias', 'last_timestamp', 'lease_fee', 'routing_fee', 'channel_opening_fee'] }
  ] },
  { pageId: 'transactions', tables: [
    { tableId: 'payments', recordsPerPage: PAGE_SIZE, sortBy: 'created_at', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['created_at', 'msatoshi'],
      columnSelection: ['created_at', 'type', 'payment_hash', 'msatoshi_sent', 'msatoshi'] },
    { tableId: 'invoices', recordsPerPage: PAGE_SIZE, sortBy: 'expires_at', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['expires_at', 'msatoshi'],
      columnSelection: ['expires_at', 'paid_at', 'type', 'description', 'msatoshi', 'msatoshi_received'] },
    { tableId: 'offers', recordsPerPage: PAGE_SIZE, sortBy: 'offer_id', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['offer_id', 'single_use'],
      columnSelection: ['offer_id', 'single_use', 'used'] },
    { tableId: 'offer_bookmarks', recordsPerPage: PAGE_SIZE, sortBy: 'lastUpdatedAt', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['lastUpdatedAt', 'amountMSat'],
      columnSelection: ['lastUpdatedAt', 'title', 'description', 'amountMSat'] }
  ] },
  { pageId: 'routing', tables: [
    { tableId: 'forwarding_history', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['received_time', 'in_msatoshi', 'out_msatoshi'],
      columnSelection: ['received_time', 'resolved_time', 'in_channel_alias', 'out_channel_alias', 'in_msatoshi', 'out_msatoshi', 'fee'] },
    { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'total_fee', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'events', 'total_fee'],
      columnSelection: ['channel_id', 'alias', 'events', 'total_amount', 'total_fee'] },
    { tableId: 'failed', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['received_time', 'in_channel_alias', 'in_msatoshi'],
      columnSelection: ['received_time', 'resolved_time', 'in_channel_alias', 'out_channel_alias', 'in_msatoshi', 'out_msatoshi', 'fee'] },
    { tableId: 'local_failed', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['received_time', 'in_channel_alias', 'in_msatoshi'],
      columnSelection: ['received_time', 'in_channel_alias', 'in_msatoshi', 'style', 'failreason'] }
  ] },
  { pageId: 'reports', tables: [
    { tableId: 'routing', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['received_time', 'in_msatoshi', 'out_msatoshi'],
      columnSelection: ['received_time', 'resolved_time', 'in_channel_alias', 'out_channel_alias', 'in_msatoshi', 'out_msatoshi', 'fee'] },
    { tableId: 'transactions', recordsPerPage: PAGE_SIZE, sortBy: 'date', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['date', 'amount_paid', 'amount_received'],
      columnSelection: ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices'] }
  ] },
  { pageId: 'graph_lookup', tables: [
    { tableId: 'query_routes', recordsPerPage: PAGE_SIZE, sortBy: 'msatoshi', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'direction', 'msatoshi'],
      columnSelection: ['alias', 'channel', 'direction', 'delay', 'msatoshi'] }
  // ] },
  // { pageId: 'peerswap', tables: [
  //   { tableId: 'swaps', recordsPerPage: PAGE_SIZE, sortBy: 'created_at', sortOrder: SortOrderEnum.DESCENDING,
  //     columnSelectionSM: ['id', 'state', 'amount'],
  //     columnSelection: ['id', 'alias', 'short_channel_id', 'created_at', 'state', 'amount'] }
  ] }
];

export const CLN_PAGE_DEFS: CLNPageDefinitions = {
  on_chain: {
    utxos: {
      maxColumns: 7,
      allowedColumns: [{ column:'txid', label: 'Transaction ID' }, { column:'address' }, { column:'scriptpubkey', label: 'Script Pubkey' }, { column:'output' }, { column:'value' }, { column:'blockheight' },
      { column:'reserved' }]
    },
    dust_utxos: {
      maxColumns: 7,
      allowedColumns: [{ column:'txid', label: 'Transaction ID' }, { column:'address' }, { column:'scriptpubkey', label: 'Script Pubkey' }, { column:'output' }, { column:'value' }, { column:'blockheight' },
      { column:'reserved' }]
    }
  },
  peers_channels: {
    open_channels: {
      maxColumns: 8,
      allowedColumns: [{ column:'short_channel_id' }, { column:'alias' }, { column:'id' }, { column:'channel_id' }, { column:'funding_txid', label: 'Funding Transaction ID' },
      { column:'connected' }, { column:'our_channel_reserve_satoshis', label: 'Local Reserve' }, { column:'their_channel_reserve_satoshis', label: 'Remote Reserve' }, { column:'msatoshi_total', label: 'Total' },
      { column:'spendable_msatoshi', label: 'Spendable' }, { column:'msatoshi_to_us', label: 'Local Balance' }, { column:'msatoshi_to_them', label: 'Remote Balance' }, { column:'balancedness', label: 'Balance Score' }]
    },
    pending_inactive_channels: {
      maxColumns: 8,
      allowedColumns: [{ column:'alias' }, { column:'id' }, { column:'channel_id' }, { column:'funding_txid', label: 'Funding Transaction ID' }, { column:'connected' }, { column:'state' },
      { column:'our_channel_reserve_satoshis', label: 'Local Reserve' }, { column:'their_channel_reserve_satoshis', label: 'Remote Reserve' }, { column:'msatoshi_total', label: 'Total' }, { column:'spendable_msatoshi', label: 'Spendable' },
      { column:'msatoshi_to_us', label: 'Local Balance' }, { column:'msatoshi_to_them', label: 'Remote Balance' }]
    },
    peers: {
      maxColumns: 3,
      allowedColumns: [{ column:'alias' }, { column:'id' }, { column:'netaddr', label: 'Network Address' }]
    },
    active_HTLCs: {
      maxColumns: 7,
      allowedColumns: [{ column:'amount_msat', label: 'Amount (Sats)' }, { column:'direction' }, { column:'id', label: 'HTLC ID' }, { column:'state' },
      { column:'expiry' }, { column:'payment_hash' }, { column:'local_trimmed' }]
    }
  },
  liquidity_ads: {
    liquidity_ads: {
      maxColumns: 8,
      allowedColumns: [{ column:'alias' }, { column:'nodeid', label: 'Node ID' }, { column:'last_timestamp', label: 'Last Announcement At' }, { column:'compact_lease' }, { column:'lease_fee' },
      { column:'routing_fee' }, { column:'channel_opening_fee' }, { column:'funding_weight' }]
    }
  },
  transactions: {
    payments: {
      maxColumns: 7,
      allowedColumns: [{ column:'created_at', label: 'Created At' }, { column:'type' }, { column:'payment_hash' }, { column:'bolt11', label: 'Invoice' }, { column:'destination' }, { column:'memo' },
      { column:'label' }, { column:'msatoshi_sent', label: 'Sats Sent' }, { column:'msatoshi', label: 'Sats Received' }]
    },
    invoices: {
      maxColumns: 7,
      allowedColumns: [{ column:'expires_at', label: 'Expiry Date' }, { column:'paid_at', label: 'Date Settled' }, { column:'type' }, { column:'description' }, { column:'label' },
      { column:'payment_hash' }, { column:'bolt11', label: 'Invoice' }, { column:'msatoshi', label: 'Amount' }, { column:'msatoshi_received', label: 'Amount Settled' }]
    },
    offers: {
      maxColumns: 4,
      allowedColumns: [{ column:'offer_id', label: 'Offer ID' }, { column:'single_use' }, { column:'used' }, { column:'bolt12', label: 'Invoice' }]
    },
    offer_bookmarks: {
      maxColumns: 6,
      allowedColumns: [{ column:'lastUpdatedAt', label: 'Updated At' }, { column:'title' }, { column:'description' }, { column:'issuer' }, { column:'bolt12', label: 'Invoice' },
      { column:'amountMSat', label: 'Amount' }]
    }
  },
  routing: {
    forwarding_history: {
      maxColumns: 8,
      allowedColumns: [{ column:'received_time' }, { column:'resolved_time' }, { column:'in_channel', label: 'In Channel ID' }, { column:'in_channel_alias', label: 'In Channel' },
      { column:'out_channel', label: 'Out Channel ID' }, { column:'out_channel_alias', label: 'Out Channel' }, { column:'payment_hash' }, { column:'in_msatoshi', label: 'Amount In' }, { column:'out_msatoshi', label: 'Amount Out' },
      { column:'fee' }]
    },
    routing_peers: {
      maxColumns: 5,
      allowedColumns: [{ column:'channel_id' }, { column:'alias', label: 'Peer Alias' }, { column:'events' }, { column:'total_amount', label: 'Amount' }, { column:'total_fee', label: 'Fee' }]
    },
    failed: {
      maxColumns: 7,
      allowedColumns: [{ column:'received_time' }, { column:'resolved_time' }, { column:'in_channel', label: 'In Channel ID' }, { column:'in_channel_alias', label: 'In Channel' },
      { column:'out_channel', label: 'Out Channel ID' }, { column:'out_channel_alias', label: 'Out Channel' }, { column:'in_msatoshi', label: 'Amount In' }, { column:'out_msatoshi', label: 'Amount Out' }, { column:'fee' }]
    },
    local_failed: {
      maxColumns: 6,
      allowedColumns: [{ column:'received_time' }, { column:'in_channel', label: 'In Channel ID' }, { column:'in_channel_alias', label: 'In Channel' }, { column:'out_channel', label: 'Out Channel ID' },
      { column:'out_channel_alias', label: 'Out Channel' }, { column:'in_msatoshi', label: 'Amount In' }, { column:'style' }, { column:'failreason', label: 'Fail Reason' }]
    }
  },
  reports: {
    routing: {
      maxColumns: 8,
      allowedColumns: [{ column:'received_time' }, { column:'resolved_time' }, { column:'in_channel', label: 'In Channel ID' }, { column:'in_channel_alias', label: 'In Channel' },
      { column:'out_channel', label: 'Out Channel ID' }, { column:'out_channel_alias', label: 'Out Channel' }, { column:'payment_hash' }, { column:'in_msatoshi', label: 'Amount In' }, { column:'out_msatoshi', label: 'Amount Out' },
      { column:'fee' }]
    },
    transactions: {
      maxColumns: 5,
      allowedColumns: [{ column:'date' }, { column:'amount_paid' }, { column:'num_payments', label: '# Payments' }, { column:'amount_received' }, { column:'num_invoices', label: '# Invoices' }]
    }
  },
  graph_lookup: {
    query_routes: {
      maxColumns: 6,
      allowedColumns: [{ column:'id' }, { column:'alias' }, { column:'channel' }, { column:'direction' }, { column:'delay' }, { column:'msatoshi', label: 'Amount' }]
    }
  // },
  // peerswap: {
  //   swaps: {
  //     maxColumns: 6,
  //     allowedColumns: [{ column:'id' }, { column:'alias' }, { column:'short_channel_id' }, { column:'created_at' }, { column:'state' }, { column:'amount' }]
  //   }
  }
};

export const LND_DEFAULT_PAGE_SETTINGS: PageSettings[] = [
  { pageId: 'on_chain', tables: [
    { tableId: 'utxos', recordsPerPage: PAGE_SIZE, sortBy: 'tx_id', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['output', 'amount_sat'],
      columnSelection: ['tx_id', 'output', 'label', 'amount_sat', 'confirmations'] },
    { tableId: 'transactions', recordsPerPage: PAGE_SIZE, sortBy: 'time_stamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['time_stamp', 'amount', 'num_confirmations'],
      columnSelection: ['time_stamp', 'label', 'amount', 'total_fees', 'block_height', 'num_confirmations'] },
    { tableId: 'dust_utxos', recordsPerPage: PAGE_SIZE, sortBy: 'tx_id', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['output', 'amount_sat'],
      columnSelection: ['tx_id', 'output', 'label', 'amount_sat', 'confirmations'] }
  ] },
  { pageId: 'peers_channels', tables: [
    { tableId: 'open', recordsPerPage: PAGE_SIZE, sortBy: 'balancedness', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'local_balance'],
      columnSelection: ['remote_alias', 'uptime_str', 'total_satoshis_sent', 'total_satoshis_received', 'local_balance', 'remote_balance', 'balancedness'] },
    { tableId: 'pending_open', sortBy: 'capacity', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'capacity'],
      columnSelection: ['remote_alias', 'commit_fee', 'commit_weight', 'capacity'] },
    { tableId: 'pending_force_closing', sortBy: 'limbo_balance', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'limbo_balance'],
      columnSelection: ['remote_alias', 'recovered_balance', 'limbo_balance', 'capacity'] },
    { tableId: 'pending_closing', sortBy: 'capacity', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'capacity'],
      columnSelection: ['remote_alias', 'local_balance', 'remote_balance', 'capacity'] },
    { tableId: 'pending_waiting_close', sortBy: 'limbo_balance', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'limbo_balance'],
      columnSelection: ['remote_alias', 'limbo_balance', 'local_balance', 'remote_balance'] },
    { tableId: 'closed', recordsPerPage: PAGE_SIZE, sortBy: 'close_type', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'settled_balance'],
      columnSelection: ['close_type', 'remote_alias', 'capacity', 'close_height', 'settled_balance'] },
    { tableId: 'active_HTLCs', recordsPerPage: PAGE_SIZE, sortBy: 'incoming', sortOrder: SortOrderEnum.ASCENDING,
      columnSelectionSM: ['amount', 'incoming', 'expiration_height'],
      columnSelection: ['amount', 'incoming', 'expiration_height', 'hash_lock'] },
    { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'sat_sent', 'sat_recv'],
      columnSelection: ['alias', 'pub_key', 'sat_sent', 'sat_recv', 'ping_time'] }
  ] },
  { pageId: 'transactions', tables: [
    { tableId: 'payments', recordsPerPage: PAGE_SIZE, sortBy: 'creation_date', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['creation_date', 'fee', 'value'],
      columnSelection: ['creation_date', 'payment_hash', 'fee', 'value', 'hops'] },
    { tableId: 'invoices', recordsPerPage: PAGE_SIZE, sortBy: 'creation_date', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['creation_date', 'settle_date', 'value'],
      columnSelection: ['creation_date', 'settle_date', 'memo', 'value', 'amt_paid_sat'] }
  ] },
  { pageId: 'routing', tables: [
    { tableId: 'forwarding_history', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amt_in', 'amt_out'],
      columnSelection: ['timestamp', 'alias_in', 'alias_out', 'amt_in', 'amt_out', 'fee_msat'] },
    { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'total_amount', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'events', 'total_amount'],
      columnSelection: ['chan_id', 'alias', 'events', 'total_amount'] },
    { tableId: 'non_routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'remote_alias', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['remote_alias', 'local_balance', 'remote_balance'],
      columnSelection: ['chan_id', 'remote_alias', 'total_satoshis_received', 'total_satoshis_sent', 'local_balance', 'remote_balance'] }
  ] },
  { pageId: 'reports', tables: [
    { tableId: 'routing', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amt_in', 'amt_out'],
      columnSelection: ['timestamp', 'alias_in', 'alias_out', 'amt_in', 'amt_out', 'fee_msat'] },
    { tableId: 'transactions', recordsPerPage: PAGE_SIZE, sortBy: 'date', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['date', 'amount_paid', 'amount_received'],
      columnSelection: ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices'] }
  ] },
  { pageId: 'graph_lookup', tables: [
    { tableId: 'query_routes', recordsPerPage: PAGE_SIZE, sortBy: 'hop_sequence', sortOrder: SortOrderEnum.ASCENDING,
      columnSelectionSM: ['hop_sequence', 'pubkey_alias', 'fee_msat'],
      columnSelection: ['hop_sequence', 'pubkey_alias', 'chan_capacity', 'amt_to_forward_msat', 'fee_msat'] }
  ] },
  { pageId: 'loop', tables: [
    { tableId: 'loop', recordsPerPage: PAGE_SIZE, sortBy: 'initiation_time', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['state', 'amt'],
      columnSelection: ['state', 'initiation_time', 'amt', 'cost_server', 'cost_offchain', 'cost_onchain'] }
  ] },
  { pageId: 'boltz', tables: [
    { tableId: 'swap_out', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['status', 'id', 'onchainAmount'],
      columnSelection: ['status', 'id', 'claimAddress', 'onchainAmount', 'timeoutBlockHeight'] },
    { tableId: 'swap_in', recordsPerPage: PAGE_SIZE, sortBy: 'status', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['status', 'id', 'expectedAmount'],
      columnSelection: ['status', 'id', 'lockupAddress', 'expectedAmount', 'timeoutBlockHeight'] }
  ] }
];

export const LND_PAGE_DEFS: LNDPageDefinitions = {
  on_chain: {
    utxos: {
      maxColumns: 7,
      allowedColumns: [{ column:'tx_id', label: 'Transaction ID' }, { column:'output' }, { column:'label' }, { column:'address_type' }, { column:'address' }, { column:'amount_sat', label: 'Amount' },
      { column:'confirmations' }]
    },
    transactions: {
      maxColumns: 7,
      allowedColumns: [{ column:'time_stamp', label: 'Date/Time' }, { column:'label' }, { column:'block_hash' }, { column:'tx_hash', label: 'Transaction Hash' }, { column:'amount' }, { column:'total_fees', label: 'Fees' },
      { column:'block_height' }, { column:'num_confirmations', label: 'Confirmations' }]
    },
    dust_utxos: {
      maxColumns: 7,
      allowedColumns: [{ column:'tx_id', label: 'Transaction ID' }, { column:'output' }, { column:'label' }, { column:'address_type' }, { column:'address' }, { column:'amount_sat' },
      { column:'confirmations' }]
    }
  },
  peers_channels: {
    open: {
      maxColumns: 8,
      allowedColumns: [{ column:'remote_alias', label: 'Peer' }, { column:'remote_pubkey', label: 'Pubkey' }, { column:'channel_point' }, { column:'chan_id', label: 'Channel ID' }, { column:'initiator' },
      { column:'static_remote_key' }, { column:'uptime_str', label: 'Uptime' }, { column:'lifetime_str', label: 'Lifetime' }, { column:'commit_fee' }, { column:'commit_weight' }, { column:'fee_per_kw', label: 'Fee/KW' },
      { column:'num_updates', label: 'Updates' }, { column:'unsettled_balance' }, { column:'capacity' }, { column:'local_chan_reserve_sat', label: 'Local Reserve' },
      { column:'remote_chan_reserve_sat', label: 'Remote Reserve' }, { column:'total_satoshis_sent', label: 'Sats Sent' }, { column:'total_satoshis_received', label: 'Sats Received' }, { column:'local_balance' },
      { column:'remote_balance' }, { column:'balancedness', label: 'Balance Score' }]
    },
    pending_open: {
      maxColumns: 7,
      disablePageSize: true,
      allowedColumns: [{ column:'remote_alias', label: 'Peer' }, { column:'remote_node_pub', label: 'Pubkey' }, { column:'channel_point' }, { column:'initiator' },
      { column:'commitment_type' }, { column:'confirmation_height' }, { column:'commit_fee' }, { column:'commit_weight' }, { column:'fee_per_kw', label: 'Fee/KW' },
      { column:'capacity' }, { column:'local_balance' }, { column:'remote_balance' }]
    },
    pending_force_closing: {
      maxColumns: 7,
      disablePageSize: true,
      allowedColumns: [{ column:'closing_txid', label: 'Closing Tx ID' }, { column:'remote_alias', label: 'Peer' }, { column:'remote_node_pub', label: 'Pubkey' }, { column:'channel_point' }, { column:'initiator' },
      { column:'commitment_type' }, { column:'limbo_balance' }, { column:'maturity_height' }, { column:'blocks_til_maturity', label: 'Blocks till Maturity' }, { column:'recovered_balance' },
      { column:'capacity' }, { column:'local_balance' }, { column:'remote_balance' }]
    },
    pending_closing: {
      maxColumns: 7,
      disablePageSize: true,
      allowedColumns: [{ column:'closing_txid', label: 'Closing Tx ID' }, { column:'remote_alias', label: 'Peer' }, { column:'remote_node_pub', label: 'Pubkey' }, { column:'channel_point' }, { column:'initiator' },
      { column:'commitment_type' }, { column:'capacity' }, { column:'local_balance' }, { column:'remote_balance' }]
    },
    pending_waiting_close: {
      maxColumns: 7,
      disablePageSize: true,
      allowedColumns: [{ column:'closing_txid', label: 'Closing Tx ID' }, { column:'remote_alias', label: 'Peer' }, { column:'remote_node_pub', label: 'Pubkey' }, { column:'channel_point' }, { column:'initiator' },
      { column:'commitment_type' }, { column:'limbo_balance' }, { column:'capacity' }, { column:'local_balance' }, { column:'remote_balance' }]
    },
    closed: {
      maxColumns: 7,
      allowedColumns: [{ column:'close_type' }, { column:'remote_alias', label: 'Peer' }, { column:'remote_pubkey', label: 'Pubkey' }, { column:'channel_point' }, { column:'chan_id', label: 'Channel ID' },
      { column:'closing_tx_hash', label: 'Closing Tx Hash' }, { column:'chain_hash' }, { column:'open_initiator' }, { column:'close_initiator' }, { column:'time_locked_balance', label: 'Timelocked Balance' },
      { column:'capacity' }, { column:'close_height' }, { column:'settled_balance' }]
    },
    active_HTLCs: {
      maxColumns: 7,
      allowedColumns: [{ column:'amount' }, { column:'incoming' }, { column:'forwarding_channel' }, { column:'htlc_index' }, { column:'forwarding_htlc_index' },
      { column:'expiration_height' }, { column:'hash_lock' }]
    },
    peers: {
      maxColumns: 8,
      allowedColumns: [{ column:'alias' }, { column:'pub_key', label: 'Public Key' }, { column:'address' }, { column:'sync_type' }, { column:'inbound' }, { column:'bytes_sent' },
      { column:'bytes_recv', label: 'Bytes Received' }, { column:'sat_sent', label: 'Sats Sent' }, { column:'sat_recv', label: 'Sats Received' }, { column:'ping_time' }]
    }
  },
  transactions: {
    payments: {
      maxColumns: 8,
      allowedColumns: [{ column:'creation_date' }, { column:'payment_hash' }, { column:'payment_request' }, { column:'payment_preimage' },
      { column:'description' }, { column:'description_hash' }, { column:'failure_reason' }, { column:'payment_index' }, { column:'fee' }, { column:'value' },
      { column:'hops' }]
    },
    invoices: {
      maxColumns: 9,
      allowedColumns: [{ column:'private' }, { column:'is_keysend', label: 'Keysend' }, { column:'is_amp', label: 'AMP' }, { column:'creation_date', label: 'Date Created' }, { column:'settle_date', label: 'Date Settled' },
      { column:'memo' }, { column:'r_preimage', label: 'Preimage' }, { column:'r_hash', label: 'Preimage Hash' }, { column:'payment_addr', label: 'Payment Address' }, { column:'payment_request' }, { column:'description_hash' },
      { column:'expiry' }, { column:'cltv_expiry' }, { column:'add_index' }, { column:'settle_index' }, { column:'value', label: 'Amount' }, { column:'amt_paid_sat', label: 'Amount Settled' }]
    }
  },
  routing: {
    forwarding_history: {
      maxColumns: 6,
      allowedColumns: [{ column:'timestamp' }, { column:'alias_in', label: 'Inbound Alias' }, { column:'chan_id_in', label: 'Inbound Channel' }, { column:'alias_out', label: 'Outbound Alias' }, { column:'chan_id_out', label: 'Outbound Channel' },
      { column:'amt_in', label: 'Inbound Amount' }, { column:'amt_out', label: 'Outbound Amount' }, { column:'fee_msat', label: 'Fee' }]
    },
    routing_peers: {
      maxColumns: 4,
      allowedColumns: [{ column:'chan_id', label: 'Channel ID' }, { column:'alias', label: 'Peer Alias' }, { column:'events' }, { column:'total_amount' }]
    },
    non_routing_peers: {
      maxColumns: 8,
      allowedColumns: [{ column:'chan_id', label: 'Channel ID' }, { column:'remote_alias', label: 'Peer Alias' }, { column:'remote_pubkey', label: 'Peer Pubkey' }, { column:'channel_point' }, { column:'uptime_str', label: 'Uptime' },
      { column:'lifetime_str', label: 'Lifetime' }, { column:'commit_fee' }, { column:'commit_weight' }, { column:'fee_per_kw', label: 'Fee/KW' }, { column:'num_updates', label: 'Updates' },
      { column:'unsettled_balance' }, { column:'capacity' }, { column:'local_chan_reserve_sat', label: 'Local Reserve' }, { column:'remote_chan_reserve_sat', label: 'Remote Reserve' },
      { column:'total_satoshis_sent', label: 'Sats Sent' }, { column:'total_satoshis_received', label: 'Sats Received' }, { column:'local_balance' }, { column:'remote_balance' }]
    }
  },
  reports: {
    routing: {
      maxColumns: 6,
      allowedColumns: [{ column:'timestamp' }, { column:'alias_in', label: 'Inbound Alias' }, { column:'chan_id_in', label: 'Inbound Channel' }, { column:'alias_out', label: 'Outbound Alias' }, { column:'chan_id_out', label: 'Outbound Channel' },
      { column:'amt_in', label: 'Inbound Amount' }, { column:'amt_out', label: 'Outbound Amount' }, { column:'fee_msat', label: 'Fee' }]
    },
    transactions: {
      maxColumns: 5,
      allowedColumns: [{ column:'date' }, { column:'amount_paid' }, { column:'num_payments', label: '# Payments' }, { column:'amount_received' }, { column:'num_invoices', label: '# Invoices' }]
    }
  },
  graph_lookup: {
    query_routes: {
      maxColumns: 8,
      disablePageSize: true,
      allowedColumns: [{ column:'hop_sequence', label: 'Hop' }, { column:'pubkey_alias', label: 'Peer' }, { column:'pub_key', label: 'Peer Pubkey' }, { column:'chan_id', label: 'Channel ID' }, { column:'tlv_payload' },
      { column:'expiry' }, { column:'chan_capacity', label: 'Capacity' }, { column:'amt_to_forward_msat', label: 'Amount To Fwd' }, { column:'fee_msat', label: 'Fee' }]
    }
  },
  loop: {
    loop: {
      maxColumns: 8,
      allowedColumns: [{ column:'state' }, { column:'initiation_time' }, { column:'last_update_time' }, { column:'amt', label: 'Amount' }, { column:'cost_server' },
      { column:'cost_offchain' }, { column:'cost_onchain' }, { column:'htlc_address' }, { column:'id' }, { column:'id_bytes', label: 'ID (Bytes)' }]
    }
  },
  boltz: {
    swap_out: {
      maxColumns: 7,
      allowedColumns: [{ column:'status' }, { column:'id', label: 'Swap ID' }, { column:'claimAddress', label: 'Claim Address' },
      { column:'onchainAmount', label: 'Onchain Amount' }, { column:'error' }, { column:'privateKey', label: 'Private Key' }, { column:'preimage' }, { column:'redeemScript', label: 'Redeem Script' }, { column:'invoice' },
      { column:'timeoutBlockHeight', label: 'Timeout Block Height' }, { column:'lockupTransactionId', label: 'Lockup Tx ID' }, { column:'claimTransactionId', label: 'Claim Tx ID' }]
    },
    swap_in: {
      maxColumns: 7,
      allowedColumns: [{ column:'status' }, { column:'id', label: 'Swap ID' }, { column:'lockupAddress', label: 'Lockup Address' }, { column:'expectedAmount', label: 'Expected Amount' }, { column:'error' },
      { column:'privateKey', label: 'Private Key' }, { column:'preimage' }, { column:'redeemScript', label: 'Redeem Script' }, { column:'invoice' }, { column:'timeoutBlockHeight', label: 'Timeout Block Height' },
      { column:'lockupTransactionId', label: 'Lockup Tx ID' }, { column:'refundTransactionId', label: 'Refund Tx ID' }]
    }
  }
};

export const ECL_DEFAULT_PAGE_SETTINGS: PageSettings[] = [
  { pageId: 'on_chain', tables: [
    { tableId: 'transaction', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amount'],
      columnSelection: ['timestamp', 'address', 'amount', 'fees', 'confirmations'] }
  ] },
  { pageId: 'peers_channels', tables: [
    { tableId: 'open_channels', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'toLocal', 'toRemote'],
      columnSelection: ['shortChannelId', 'alias', 'feeBaseMsat', 'feeProportionalMillionths', 'toLocal', 'toRemote', 'balancedness'] },
    { tableId: 'pending_channels', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['state', 'alias', 'toLocal'],
      columnSelection: ['state', 'alias', 'toLocal', 'toRemote'] },
    { tableId: 'inactive_channels', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['state', 'alias', 'toLocal'],
      columnSelection: ['state', 'shortChannelId', 'alias', 'toLocal', 'toRemote', 'balancedness'] },
    { tableId: 'peers', recordsPerPage: PAGE_SIZE, sortBy: 'alias', sortOrder: SortOrderEnum.ASCENDING,
      columnSelectionSM: ['alias', 'nodeId'],
      columnSelection: ['alias', 'nodeId', 'address', 'channels'] }
  ] },
  { pageId: 'transactions', tables: [
    { tableId: 'payments', recordsPerPage: PAGE_SIZE, sortBy: 'firstPartTimestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['firstPartTimestamp', 'recipientAmount'],
      columnSelection: ['firstPartTimestamp', 'id', 'recipientNodeAlias', 'recipientAmount'] },
    { tableId: 'invoices', recordsPerPage: PAGE_SIZE, sortBy: 'receivedAt', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amount', 'amountSettled'],
      columnSelection: ['timestamp', 'receivedAt', 'description', 'amount', 'amountSettled'] }
  ] },
  { pageId: 'routing', tables: [
    { tableId: 'forwarding_history', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amountIn', 'fee'],
      columnSelection: ['timestamp', 'fromChannelAlias', 'toChannelAlias', 'amountIn', 'amountOut', 'fee'] },
    { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'totalFee', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['alias', 'events', 'totalFee'],
      columnSelection: ['channelId', 'alias', 'events', 'totalAmount', 'totalFee'] }
  ] },
  { pageId: 'reports', tables: [
    { tableId: 'routing', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['timestamp', 'amountIn', 'fee'],
      columnSelection: ['timestamp', 'fromChannelAlias', 'toChannelAlias', 'amountIn', 'amountOut', 'fee'] },
    { tableId: 'transactions', recordsPerPage: PAGE_SIZE, sortBy: 'date', sortOrder: SortOrderEnum.DESCENDING,
      columnSelectionSM: ['date', 'amount_paid', 'amount_received'],
      columnSelection: ['date', 'amount_paid', 'num_payments', 'amount_received', 'num_invoices'] }
  ] }
];

export const ECL_PAGE_DEFS: ECLPageDefinitions = {
  on_chain: {
    transaction: {
      maxColumns: 6,
      allowedColumns: [{ column:'timestamp', label: 'Date/Time' }, { column:'address' }, { column:'blockHash' }, { column:'txid', label: 'Transaction ID' }, { column:'amount' },
      { column:'fees' }, { column:'confirmations' }]
    }
  },
  peers_channels: {
    open_channels: {
      maxColumns: 8,
      allowedColumns: [{ column:'shortChannelId' }, { column:'channelId' }, { column:'alias' }, { column:'nodeId' }, { column:'isInitiator', label: 'Initiator' },
      { column:'feeBaseMsat', label: 'Base Fee' }, { column:'feeProportionalMillionths', label: 'Fee Rate' }, { column:'toLocal', label: 'Local Balance' }, { column:'toRemote', label: 'Remote Balance' },
      { column:'balancedness', label: 'Balance Score' }]
    },
    pending_channels: {
      maxColumns: 7,
      allowedColumns: [{ column:'state' }, { column:'channelId' }, { column:'alias' }, { column:'nodeId' }, { column:'isInitiator', label: 'Initiator' },
      { column:'toLocal', label: 'Local Balance' }, { column:'toRemote', label: 'Remote Balance' }]
    },
    inactive_channels: {
      maxColumns: 8,
      allowedColumns: [{ column:'state' }, { column:'shortChannelId' }, { column:'channelId' }, { column:'alias' }, { column:'nodeId' },
      { column:'isInitiator', label: 'Initiator' }, { column:'toLocal', label: 'Local Balance' },
      { column:'toRemote', label: 'Remote Balance' }, { column:'balancedness', label: 'Balance Score' }]
    },
    peers: {
      maxColumns: 4,
      allowedColumns: [{ column:'alias' }, { column:'nodeId' }, { column:'address', label: 'Netwrok Address' }, { column:'channels' }]
    }
  },
  transactions: {
    payments: {
      maxColumns: 7,
      allowedColumns: [{ column:'firstPartTimestamp', label: 'Date/Time' }, { column:'id' }, { column:'recipientNodeId', label: 'Destination Node ID' }, { column:'recipientNodeAlias', label: 'Destination' },
      { column:'description' }, { column:'paymentHash' }, { column:'paymentPreimage', label: 'Preimage' }, { column:'recipientAmount', label: 'Amount' }]
    },
    invoices: {
      maxColumns: 7,
      allowedColumns: [{ column:'timestamp', label: 'Date Created' }, { column:'expiresAt', label: 'Date Expiry' }, { column:'receivedAt', label: 'Date Settled' }, { column:'nodeId', label: 'Node ID' }, { column:'description' },
      { column:'paymentHash' }, { column:'amount' }, { column:'amountSettled', label: 'Amount Settled' }]
    }
  },
  routing: {
    forwarding_history: {
      maxColumns: 7,
      allowedColumns: [{ column:'timestamp', label: 'Date/Time' }, { column:'fromChannelId', label: 'In Channel ID' }, { column:'fromShortChannelId', label: 'In Channel Short ID' }, { column:'fromChannelAlias', label: 'In Channel' },
      { column:'toChannelId', label: 'Out Channel ID' }, { column:'toShortChannelId', label: 'Out Channel Short ID' }, { column:'toChannelAlias', label: 'Out Channel' }, { column:'paymentHash' }, { column:'amountIn' },
      { column:'amountOut' }, { column:'fee', label: 'Fee Earned' }]
    },
    routing_peers: {
      maxColumns: 5,
      allowedColumns: [{ column:'channelId' }, { column:'alias', label: 'Peer Alias' }, { column:'events' }, { column:'totalAmount', label: 'Amount' }, { column:'totalFee', label: 'Fee' }]
    }
  },
  reports: {
    routing: {
      maxColumns: 7,
      allowedColumns: [{ column:'timestamp', label: 'Date/Time' }, { column:'fromChannelId', label: 'In Channel ID' }, { column:'fromShortChannelId', label: 'In Channel Short ID' }, { column:'fromChannelAlias', label: 'In Channel' },
      { column:'toChannelId', label: 'Out Channel ID' }, { column:'toShortChannelId', label: 'Out Channel Short ID' }, { column:'toChannelAlias', label: 'Out Channel' }, { column:'paymentHash' }, { column:'amountIn' },
      { column:'amountOut' }, { column:'fee', label: 'Fee Earned' }]
    },
    transactions: {
      maxColumns: 5,
      allowedColumns: [{ column:'date' }, { column:'amount_paid' }, { column:'num_payments', label: '# Payments' }, { column:'amount_received' }, { column:'num_invoices', label: '# Invoices' }]
    }
  }
};

export const FIAT_CURRENCY_ICONS_SGV = {
  CZK: `
  <svg class="currency-icon" version='1.0' xmlns='http://www.w3.org/2000/svg' width="300px" height="300px" viewBox='0 0 137.000000 118.000000' preserveAspectRatio='xMidYMid meet'>
    <g transform='translate(0.000000,118.000000) scale(0.100000,-0.100000)' stroke='none'>
      <path d='M80 600 l0 -410 50 0 50 0 0 138 0 138 69 68 69 69 46 -64 c25 -35
      91 -128 146 -206 l101 -143 71 0 70 0 -24 33 c-99 130 -328 446 -328 451 0 4
      75 81 168 171 l167 164 -70 1 -70 0 -200 -200 c-110 -110 -203 -200 -207 -200
      -5 0 -8 90 -8 200 l0 200 -50 0 -50 0 0 -410z'/>
      <path d='M946 935 l56 -75 57 0 57 0 57 70 c31 38 57 72 57 75 0 3 -24 5 -52
      5 -52 0 -54 -1 -82 -46 l-30 -47 -23 29 c-13 16 -26 37 -29 47 -4 14 -17 17
      -65 17 l-59 0 56 -75z'/>
      <path d='M939 762 c-99 -51 -148 -164 -136 -315 12 -168 114 -267 274 -267 60
      0 139 36 175 78 32 39 64 120 52 132 -5 4 -26 10 -47 12 -37 3 -40 1 -52 -35
      -55 -160 -254 -136 -295 34 -29 121 10 258 84 293 78 37 173 9 197 -58 12 -32
      17 -36 49 -36 54 0 65 11 51 51 -32 93 -106 139 -223 139 -63 0 -84 -5 -129
      -28z'/>
    </g>
  </svg>
  `,
  DKK: `
  <svg class="currency-icon" xmlns='http://www.w3.org/2000/svg' width="300px" height="300px" viewBox='0 0 100 74.18'>
    <path d='M58.58 72.85H41.05L22 42.15l-6.53 4.68v26H0V0H15.44V33.33l6.09-8.57L41.24 0H58.38L33 32.24 58.58 72.85ZM95 16.12a25.27 25.27 0 0 1 5.14.44L99 30.81a18.05 18.05 0 0 0-4.49-.49q-7.28 0-11.32 3.74T79.09 44.52V72.85H63.91V17.14H75.42l2.22 9.39h.75a21.26 21.26 0 0 1 7-7.55A17.15 17.15 0 0 1 95 16.12Zm10.48 49.59q0-4.18Z' />
  </svg>
  `,
  HRK: `
  <?xml version="1.0" encoding="iso-8859-1"?>
  <!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/15766/croatia-kuna-currency-symbol -->
  <svg class="currency-icon" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="300px" height="300px" viewBox="0 0 75.045 75.045" style="enable-background:new 0 0 75.045 75.045;"
    xml:space="preserve">
    <g>
      <path d="M75.045,42.207v25.959c0,0.301-0.243,0.545-0.544,0.545h-6.817c-0.3,0-0.543-0.244-0.543-0.545V43.105
        c0-8.162-3.111-12.302-9.244-12.302c-4.526,0-8.375,3.021-9.809,7.7c-0.331,0.912-0.516,2.187-0.516,3.522v26.14
        c0,0.301-0.243,0.543-0.543,0.543h-8.448c-0.3,0-0.544-0.242-0.544-0.543l-0.033-43.474c0-0.145,0.059-0.283,0.159-0.385
        c0.103-0.103,0.239-0.159,0.385-0.159h7.17c0.146,0,0.283,0.058,0.386,0.16c0.103,0.103,0.158,0.241,0.157,0.387l-0.03,5.434
        c1.951-3.095,5.375-6.426,12.367-6.426C62.457,23.704,75.045,25.039,75.045,42.207z M14.096,46.926L31.08,25.684
        c0.244-0.306,0.283-0.726,0.102-1.065c-0.176-0.331-0.519-0.535-0.897-0.535H23.02c-0.312,0-0.61,0.145-0.799,0.385L7.874,42.679
        V7.293c0-0.546-0.453-0.989-1.011-0.989H1.012C0.454,6.305,0,6.748,0,7.293V67.75c0,0.547,0.454,0.989,1.012,0.989h5.851
        c0.558,0,1.011-0.442,1.011-0.989V52.449l0.854-0.015l15.355,15.996c0.189,0.196,0.458,0.31,0.734,0.31h6.928
        c0.385,0,0.743-0.219,0.913-0.562c0.175-0.358,0.114-0.783-0.159-1.086L14.096,46.926z"/>
    </g>
  </svg>
  `,
  HUF: `
  <?xml version="1.0" encoding="iso-8859-1"?>
  <!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
  <!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/183602/forint-business-and-finance -->
  <svg class="currency-icon" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="300px" height="300px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
    <g>
      <path d="M265.485,0.03L151.71,0.015c-0.364-0.036-0.62,0.004-0.929,0.015H37.932
        c-15.708,0-28.444,12.735-28.444,28.444v455.082C9.489,499.264,22.224,512,37.932,512s28.444-12.735,28.444-28.444V287.128h142.408
        c15.708,0,28.444-12.735,28.444-28.444c0-15.708-12.735-28.444-28.444-28.444H66.376V56.917h199.105
        c15.708,0,28.442-12.733,28.444-28.442C293.927,12.769,281.193,0.032,265.485,0.03z"/>
      <path d="M474.067,455.114c-36.596,0-66.368-29.773-66.368-66.368V170.692h28.444
        c15.708,0,28.444-12.735,28.444-28.444s-12.735-28.444-28.444-28.444h-28.444V28.474c0-15.708-12.735-28.444-28.444-28.444
        c-15.708,0-28.444,12.735-28.444,28.444v85.331h-28.444c-15.708,0-28.444,12.735-28.444,28.444s12.735,28.444,28.444,28.444h28.444
        v218.052c0,67.963,55.292,123.256,123.256,123.256c15.708,0,28.444-12.735,28.444-28.444
        C502.511,467.848,489.776,455.114,474.067,455.114z"/>
    </g>
  </svg>
  `,
  PLN: `
  <svg class="currency-icon" version='1.0' xmlns='http://www.w3.org/2000/svg' 
    width="300px" height="300px" viewBox='0 0 154.000000 169.000000' preserveAspectRatio='xMidYMid meet'>
    <g transform='translate(0.000000,169.000000) scale(0.100000,-0.100000)' stroke='none'>
      <path d='M1070 1225 l0 -324 -122 -93 c-68 -50 -126 -96 -130 -102 -13 -18 -9
      -54 8 -70 27 -28 59 -17 147 49 48 36 89 65 92 65 3 0 5 -135 5 -300 l0 -300
      100 0 100 0 0 379 0 379 116 86 c63 48 118 94 121 103 3 8 2 27 -3 42 -7 20
      -17 27 -41 29 -26 3 -46 -8 -106 -52 -41 -31 -77 -56 -80 -56 -4 0 -7 110 -7
      245 l0 245 -100 0 -100 0 0 -325z'/>
      <path d='M114 1107 c-3 -8 -4 -47 -2 -88 l3 -74 233 -3 c127 -1 232 -5 232 -8
      0 -3 -20 -29 -44 -57 -24 -29 -139 -176 -255 -327 l-211 -275 0 -62 0 -63 395
      0 395 0 0 85 0 85 -256 0 c-141 0 -254 3 -252 8 2 4 33 45 70 92 37 47 150
      193 252 325 l185 240 1 55 c0 31 -5 61 -12 68 -19 19 -727 17 -734 -1z'/>
    </g>
  </svg>
  `,
  RON: `
  <?xml version="1.0" encoding="iso-8859-1"?>
  <!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
  <!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/64526/romania-lei-currency -->
  <svg class="currency-icon" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="300px" height="300px" viewBox="0 0 74.19 74.19" style="enable-background:new 0 0 74.19 74.19;" xml:space="preserve"
    >
    <g>
      <path d="M10.052,6.186v60.96c0,0.688-0.559,1.248-1.249,1.248H1.248C0.559,68.394,0,67.834,0,67.146V6.186
        c0-0.689,0.559-1.248,1.248-1.248h7.555C9.493,4.938,10.052,5.496,10.052,6.186z M56.245,44.135c0,1.643-0.093,2.9-0.282,3.852
        c-0.117,0.582-0.629,1.004-1.224,1.004c-0.001,0-0.002,0-0.004,0l-27.798-0.08c0.792,10.729,9.185,11.923,12.862,11.923
        c5.455,0,8.639-0.995,11.035-1.97c0.334-0.137,0.711-0.119,1.032,0.041c0.321,0.164,0.558,0.455,0.647,0.804l1.373,5.323
        c0.151,0.588-0.142,1.199-0.695,1.451c-2.799,1.264-7.574,2.771-14.422,2.771c-13.172,0-21.684-8.714-21.684-22.197
        c0-13.98,8.563-23.744,20.824-23.744C51.443,23.311,56.245,34.529,56.245,44.135z M27.176,40.996h19.242
        c-0.128-1.918-0.689-5.17-2.908-7.429c-1.531-1.56-3.617-2.351-6.201-2.351C31.211,31.217,28.124,36.212,27.176,40.996z
        M67.963,19.197h0.086c3.5,0,6.142-2.64,6.142-6.144c0-3.452-2.603-6.054-6.058-6.054c-3.5,0-6.142,2.602-6.142,6.054
        C61.991,16.557,64.559,19.197,67.963,19.197z M71.911,24.341h-7.555c-0.689,0-1.249,0.56-1.249,1.248v41.557
        c0,0.688,0.559,1.248,1.249,1.248h7.555c0.69,0,1.249-0.56,1.249-1.248V25.589C73.159,24.901,72.602,24.341,71.911,24.341z"/>
    </g>
  </svg>
  `,
  TWD: `
  <?xml version="1.0" encoding="iso-8859-1"?>
  <!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
  <!-- License: CC0. Made by SVG Repo: https://www.svgrepo.com/svg/142061/new-taiwan-dollar -->
  <svg class="currency-icon" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
    width="300px" height="300px" viewBox="0 0 300 300" style="enable-background:new 0 0 300 300;" xml:space="preserve">
    <g id="XMLID_7_">
      <path id="XMLID_8_" d="M265,90c8.284,0,15-6.716,15-15s-6.716-15-15-15H35c-8.284,0-15,6.716-15,15s6.716,15,15,15h65v115
        c0,35.841-29.159,65-65,65c-8.284,0-15,6.716-15,15s6.716,15,15,15c52.383,0,95-42.617,95-95V90h70v145c0,35.841,29.159,65,65,65
        c8.284,0,15-6.716,15-15s-6.716-15-15-15c-19.299,0-35-15.701-35-35V90H265z"/>
      <path id="XMLID_9_" d="M35,30h230c8.284,0,15-6.716,15-15s-6.716-15-15-15H35c-8.284,0-15,6.716-15,15S26.716,30,35,30z"/>
    </g>
  </svg>
  `
};

// Name and symbols confirmed from https://www.xe.com/symbols/
// Most SVGs are copied from https://www.svgviewer.dev
export const FIAT_CURRENCY_UNITS: FiatCurrency[] = [
  { id: 'USD', name: 'United States Dollar', iconType: 'FA', symbol: faDollarSign }, { id: 'ARS', name: 'Argentina Peso', iconType: 'FA', symbol: faDollarSign }, { id: 'AUD', name: 'Australia Dollar', iconType: 'FA', symbol: faDollarSign },
  { id: 'BRL', name: 'Brazil Real', iconType: 'FA', symbol: faBrazilianRealSign }, { id: 'CAD', name: 'Canada Dollar', iconType: 'FA', symbol: faDollarSign }, { id: 'CHF', name: 'Switzerland Franc', iconType: 'FA', symbol: faFrancSign },
  { id: 'CLP', name: 'Chile Peso', iconType: 'FA', symbol: faDollarSign }, { id: 'CNY', name: 'China Yuan Renminbi', iconType: 'FA', symbol: faYenSign }, { id: 'CZK', name: 'Czech Republic Koruna', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.CZK, class: 'currency-icon-x-large' },
  { id: 'DKK', name: 'Denmark Krone', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.DKK, class: 'currency-icon-medium' }, { id: 'EUR', name: 'Euro Member Countries', iconType: 'FA', symbol: faEuroSign }, { id: 'GBP', name: 'United Kingdom Pound', iconType: 'FA', symbol: faSterlingSign },
  { id: 'HKD', name: 'Hong Kong Dollar', iconType: 'FA', symbol: faDollarSign }, { id: 'HRK', name: 'Croatia Kuna', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.HRK, class: 'currency-icon-medium' }, { id: 'HUF', name: 'Hungary Forint', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.HUF, class: 'currency-icon-small' },
  { id: 'INR', name: 'India Rupee', iconType: 'FA', symbol: faIndianRupeeSign }, { id: 'ISK', name: 'Iceland Krona', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.DKK, class: 'currency-icon-medium' }, { id: 'JPY', name: 'Japan Yen', iconType: 'FA', symbol: faYenSign },
  { id: 'KRW', name: 'Korea (South) Won', iconType: 'FA', symbol: faWonSign }, { id: 'NZD', name: 'New Zealand Dollar', iconType: 'FA', symbol: faDollarSign }, { id: 'PLN', name: 'Poland Zloty', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.PLN, class: 'currency-icon-large' },
  { id: 'RON', name: 'Romania Leu', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.RON, class: 'currency-icon-medium' }, { id: 'RUB', name: 'Russia Ruble', iconType: 'FA', symbol: faRubleSign }, { id: 'SEK', name: 'Sweden Krona', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.DKK, class: 'currency-icon-medium' },
  { id: 'SGD', name: 'Singapore Dollar', iconType: 'FA', symbol: faDollarSign }, { id: 'THB', name: 'Thailand Baht', iconType: 'FA', symbol: faBahtSign }, { id: 'TRY', name: 'Turkey Lira', iconType: 'FA', symbol: faTurkishLiraSign },
  { id: 'TWD', name: 'Taiwan New Dollar', iconType: 'SVG', symbol: FIAT_CURRENCY_ICONS_SGV.TWD, class: 'currency-icon-small' }
];

export function getSelectedCurrency(currencyID: string) {
  const foundCurrency = FIAT_CURRENCY_UNITS.find((currencyUnit) => currencyUnit.id === currencyID);
  if (foundCurrency.iconType === 'SVG' && typeof foundCurrency.symbol === 'string') {
    foundCurrency.symbol = foundCurrency.symbol.replace('<svg class="currency-icon"', '<svg class= "currency-icon ' + foundCurrency.class + '"');
  }
  return foundCurrency;
}


export function getFeeLimitSat(selFeeLimitTypeID: string, feeLimit: number, amount?: number) {
  if (selFeeLimitTypeID === 'fixed') {
    return feeLimit;
  }
  if (selFeeLimitTypeID === 'percent') {
    return Math.ceil(((amount || 0) * feeLimit) / 100);
  }
  return 1000000;
}
