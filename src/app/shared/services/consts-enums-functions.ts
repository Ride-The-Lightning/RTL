import { MatPaginatorIntl } from '@angular/material/paginator';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}

export const CURRENCY_UNITS = [ 'Sats', 'BTC' ];
export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2'};
export const FIAT_CURRENCY_UNITS = [
  {id: 'USD', name: 'USD'}, 
  {id: 'AUD', name: 'AUD'}, {id: 'BRL', name: 'BRL'}, {id: 'CAD', name: 'CAD'}, 
  {id: 'CHF', name: 'CHF'}, {id: 'CLP', name: 'CLP'}, {id: 'CNY', name: 'CNY'}, 
  {id: 'DKK', name: 'DKK'}, {id: 'EUR', name: 'EUR'}, {id: 'GBP', name: 'GBP'},
  {id: 'HKD', name: 'HKD'}, {id: 'INR', name: 'INR'}, {id: 'ISK', name: 'ISK'}, 
  {id: 'JPY', name: 'JPY'}, {id: 'KRW', name: 'KRW'}, {id: 'NZD', name: 'NZD'}, 
  {id: 'PLN', name: 'PLN'}, {id: 'RUB', name: 'RUB'}, {id: 'SEK', name: 'SEK'}, 
  {id: 'SGD', name: 'SGD'}, {id: 'THB', name: 'THB'}, {id: 'TWD', name: 'TWD'}
];

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export const ADDRESS_TYPES = [
  { addressId: '0', addressCode: 'bech32', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash'},
  { addressId: '1', addressCode: 'p2sh-segwit', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)'}
];

export const TRANS_TYPES = [
  {id: '0', name: 'Priority (Default)'},
  {id: '1', name: 'Target Confirmation Blocks'},
  {id: '2', name: 'Fee'}
];

export const FEE_LIMIT_TYPES = [
  {id: 'none', name: 'No Fee Limit', placeholder: 'No Limit'},
  {id: 'fixed', name: 'Fixed Limit (Sats)', placeholder: 'Fixed Limit in Sats'},
  {id: 'percent', name: 'Percentage of Payment Amount', placeholder: 'Percentage Limit'}
];

export const FEE_RATE_TYPES = [
  { feeRateId: 'urgent', feeRateType: 'Urgent'},
  { feeRateId: 'normal', feeRateType: 'Normal'},
  { feeRateId: 'slow', feeRateType: 'Slow'},
]


export const NODE_SETTINGS = {
  themes: [
    {id: 'PURPLE', name: 'Diogo'}, 
    {id: 'TEAL', name: 'My2Sats'},
    {id: 'INDIGO', name: 'RTL'},
    {id: 'PINK', name: 'BK'}
  ],
  modes: [{id: 'DAY', name: 'Day'}, {id: 'NIGHT', name: 'Night'}]
};

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
  TOKEN = 'TOKEN',
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
  LITOSHIS = 'LITOSHIS',
  LTC = 'LTC',
  OTHER = 'OTHER'
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
  MD = 'MD', // 840 - 1439 => tab landscape & small laptops
  LG = 'LG'  // >1440 => big laptops
}

export const CHANNEL_CLOSURE_TYPE = {
  COOPERATIVE_CLOSE: { name: 'Co-operative Close', tooltip: 'Channel closed cooperatively' },
  LOCAL_FORCE_CLOSE: { name: 'Local Force Close', tooltip: 'Channel force-closed by the local node' },
  REMOTE_FORCE_CLOSE: { name: 'Remote Force Close', tooltip: 'Channel force-closed by the remote node' },
  BREACH_CLOSE: { name: 'Breach Close', tooltip: 'Remote node attempted to broadcast a prior revoked channel state' },
  FUNDING_CANCELED: { name: 'Funding Canceled', tooltip: 'Channel never fully opened' },
  ABANDONED: { name: 'Abandoned', tooltip: 'Channel abandoned by the local node' }
}

export enum SwapStateEnum {
  INITIATED	= 'Initiated',
  PREIMAGE_REVEALED	= 'Preimage Revealed',
  HTLC_PUBLISHED	= 'HTLC Published',
  SUCCESS	= 'Successful',
  FAILED	= 'Failed',
  INVOICE_SETTLED	= 'Invoice Settled'
}

export enum SwapTypeEnum {
  LOOP_OUT = 'LOOP_OUT',
  LOOP_IN = 'LOOP_IN'
}
