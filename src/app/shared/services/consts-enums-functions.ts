import { MatPaginatorIntl } from '@angular/material';

export function getPaginatorLabel(field: string) {
  const appPaginator = new MatPaginatorIntl();
  appPaginator.itemsPerPageLabel = field + ' per page:';
  return appPaginator;
}

export const CURRENCY_UNITS = [ 'Sats', 'BTC' ];
export const CURRENCY_UNIT_FORMATS = { Sats: '1.0-0', BTC: '1.6-6', OTHER: '1.2-2'};
export const FIAT_CURRENCY_UNITS = [
  {id: 'USD', name: 'United States Dollar'}, 
  {id: 'AUD', name: 'AUD'}, {id: 'BRL', name: 'BRL'}, {id: 'CAD', name: 'CAD'}, 
  {id: 'CHF', name: 'CHF'}, {id: 'CLP', name: 'CLP'}, {id: 'CNY', name: 'CNY'}, 
  {id: 'DKK', name: 'DKK'}, {id: 'EUR', name: 'EUR'}, {id: 'GBP', name: 'Pound'},
  {id: 'HKD', name: 'HKD'}, {id: 'INR', name: 'Indian Rupee'}, {id: 'ISK', name: 'ISK'}, 
  {id: 'JPY', name: 'JPY'}, {id: 'KRW', name: 'KRW'}, {id: 'NZD', name: 'NZD'}, 
  {id: 'PLN', name: 'PLN'}, {id: 'RUB', name: 'RUB'}, {id: 'SEK', name: 'SEK'}, 
  {id: 'SGD', name: 'SGD'}, {id: 'THB', name: 'THB'}, {id: 'TWD', name: 'TWD'}
];

export const TIME_UNITS = ['SECS', 'MINS', 'HOURS', 'DAYS'];

export const PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 100];

export const ADDRESS_TYPES = [
  { addressId: '0', addressTp: 'Bech32 (P2WKH)', addressDetails: 'Pay to witness key hash'},
  { addressId: '1', addressTp: 'P2SH (NP2WKH)', addressDetails: 'Pay to nested witness key hash (default)'}
];

export const TRANS_TYPES = [
  {id: '0', name: 'Priority (Default)'},
  {id: '1', name: 'Target Confirmation Blocks'},
  {id: '2', name: 'Fee'}
];

export const FEE_LIMIT_TYPES = [
  {id: 'none', name: 'No Fee Limit', placeholder: 'No Limit'},
  {id: 'fixed', name: 'Fixed (Sats)', placeholder: 'Fixed Limit in Sats'},
  // {id: 'fixed_msat', name: 'Fixed in mSats'},
  {id: 'percent', name: 'Percentage of Payment Amount', placeholder: 'Percentage Limit'}
];

export const NODE_SETTINGS = {
  themes: [
    {id: 'purple', name: 'Diogo'}, 
    {id: 'teal', name: 'My2Sats'},
    {id: 'indigo', name: 'RTL'},
    {id: 'pink', name: 'BK'}
  ],
  modes: [{id: 'day', name: 'Day'}, {id: 'night', name: 'Night'}],
  fontSize: [{id: 1, name: 'Small', class: 'small-font'}, {id: 2, name: 'Regular', class: 'regular-font'}, {id: 3, name: 'Large', class: 'large-font'}],
  menuTypes: [{id: 'regular', name: 'Regular'}, {id: 'compact', name: 'Compact'}, {id: 'mini', name: 'Mini'}],
  menus: [{id: 'vertical', name: 'Vertical'}, {id: 'horizontal', name: 'Horizontal'}]
};

export enum UserPersonaEnum {
  OPERATOR = 'operator',
  MERCHANT = 'merchant',
  ALL = 'all'
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
