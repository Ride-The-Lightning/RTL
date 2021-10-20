import { MatPaginatorIntl } from '@angular/material/paginator';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}

export const CURRENCY_UNITS = ['Sats', 'BTC'];
export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2' };
export const FIAT_CURRENCY_UNITS = [
  { id: 'USD', name: 'USD' },
  { id: 'AUD', name: 'AUD' }, { id: 'BRL', name: 'BRL' }, { id: 'CAD', name: 'CAD' },
  { id: 'CHF', name: 'CHF' }, { id: 'CLP', name: 'CLP' }, { id: 'CNY', name: 'CNY' },
  { id: 'DKK', name: 'DKK' }, { id: 'EUR', name: 'EUR' }, { id: 'GBP', name: 'GBP' },
  { id: 'HKD', name: 'HKD' }, { id: 'INR', name: 'INR' }, { id: 'ISK', name: 'ISK' },
  { id: 'JPY', name: 'JPY' }, { id: 'KRW', name: 'KRW' }, { id: 'NZD', name: 'NZD' },
  { id: 'PLN', name: 'PLN' }, { id: 'RUB', name: 'RUB' }, { id: 'SEK', name: 'SEK' },
  { id: 'SGD', name: 'SGD' }, { id: 'THB', name: 'THB' }, { id: 'TWD', name: 'TWD' }
];

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export const ADDRESS_TYPES = [
  { addressId: '0', addressCode: 'bech32', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash' },
  { addressId: '1', addressCode: 'p2sh-segwit', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)' }
];

export const TRANS_TYPES = [
  { id: '0', name: 'Priority (Default)' },
  { id: '1', name: 'Target Confirmation Blocks' },
  { id: '2', name: 'Fee' }
];

export const FEE_LIMIT_TYPES = [
  { id: 'none', name: 'No Fee Limit', placeholder: 'No Limit' },
  { id: 'fixed', name: 'Fixed Limit (Sats)', placeholder: 'Fixed Limit in Sats' },
  { id: 'percent', name: 'Percentage of Payment Amount', placeholder: 'Percentage Limit' }
];

export const FEE_RATE_TYPES = [
  { feeRateId: 'urgent', feeRateType: 'Urgent' },
  { feeRateId: 'normal', feeRateType: 'Normal' },
  { feeRateId: 'slow', feeRateType: 'Slow' },
  { feeRateId: 'customperkb', feeRateType: 'Custom (Sats/vB)' }
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

export enum WSEventTypeEnum {
  PAYMENT_RECEIVED = 'payment-received',
  PAYMENT_RELAYED = 'payment-relayed',
  PAYMENT_SENT = 'payment-sent',
  PAYMENT_SETTLING_ONCHAIN = 'payment-settling-onchain',
  PAYMENT_FAILED = 'payment-failed',
  CHANNEL_OPENED = 'channel-opened',
  CHANNEL_STATE_CHANGED = 'channel-state-changed',
  CHANNEL_CLOSED = 'channel-closed'
}

export const WSEventsECL = [
  { type: WSEventTypeEnum.PAYMENT_RECEIVED, name: 'Payment Received', description: 'A payment has been received' },
  { type: WSEventTypeEnum.PAYMENT_RELAYED, name: 'Payment Relayed', description: 'A payment has been successfully relayed' },
  { type: WSEventTypeEnum.PAYMENT_SENT, name: 'Payment Sent', description: 'A payment has been successfully sent' },
  { type: WSEventTypeEnum.PAYMENT_SETTLING_ONCHAIN, name: 'Payment Settling Onchain', description: 'A payment was not fulfilled and its HTLC is being redeemed on-chain' },
  { type: WSEventTypeEnum.PAYMENT_FAILED, name: 'Payment Failed', description: 'A payment failed' },
  { type: WSEventTypeEnum.CHANNEL_OPENED, name: 'Channel Opened', description: 'A channel opening flow has started' },
  { type: WSEventTypeEnum.CHANNEL_STATE_CHANGED, name: 'Channel State Changed', description: 'A channel state changed' },
  { type: WSEventTypeEnum.CHANNEL_CLOSED, name: 'Channel Closed', description: 'A channel has been closed' }
];

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
  UNUSED_NESTED_PUBKEY_HASH: { name: 'Unused Nested Pubkey Hash', tooltip: '' }
};

export enum CLChannelPendingState {
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
  BOLTZ = 'BOLTZ'
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
  DECODE_PAYMENTS: 'Decoding Payments...',
  GET_SENT_PAYMENTS: 'Getting Sent Payments...',
  SEND_PAYMENT: 'Sending Payment...',
  SEND_KEYSEND: 'Sending Keysend Payment...',
  SEARCHING_NODE: 'Searching Node...',
  SEARCHING_CHANNEL: 'Searching Channel...',
  SEARCHING_INVOICE: 'Searching Invoice...',
  BACKUP_CHANNEL: 'Backup Channels...',
  VERIFY_CHANNEL: 'Verify Channels...',
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
  UPDATE_UI_SETTINGS: 'Updating Settings...',
  UPDATE_NODE_SETTINGS: 'Updating Node Settings...',
  UPDATE_SELECTED_NODE: 'Updating Selected Node...',
  OPEN_CONFIG_FILE: 'Opening Config File...',
  GET_SERVICE_INFO: 'Getting Service Info...',
  GET_QUOTE: 'Getting Quotes...',
  UPDATE_DEFAULT_NODE_SETTING: 'Updating Defaule Node Settings...',
  GET_BOLTZ_SWAPS: 'Getting Boltz Swaps...',
  SIGN_MESSAGE: 'Signing Message...',
  VERIFY_MESSAGE: 'Verifying Message...',
  BUMP_FEE: 'Bumping Fee...',
  LEASE_UTXO: 'Leasing UTXO...',
  GET_LOOP_SWAPS: 'Getting List Swaps...',
  GET_FEE_REPORT: 'Getting fee report...',
  GET_LOOKUP_DETAILS: 'Getting lookup details...',
  GET_RTL_CONFIG: 'Getting RTL Config...',
  VERIFY_TOKEN: 'Verify Token...'
};
